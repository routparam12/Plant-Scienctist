import logging
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import List, Optional, Dict, Any

from app.core.supabase import supabase
from app.core.exceptions import NotFound, UpstreamError
from app.schemas.crops import (
    CropCatalogItem,
    UserCropCreate,
    UserCropUpdate,
    UserCropResponse,
    UserCropDetailResponse,
)
from app.services.crop_progress import compute_progress, needs_care
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


class CropService:
    @staticmethod
    def get_catalog() -> List[CropCatalogItem]:
        """
        Returns all catalog crops that have verified growth stage data.
        Does not use silent fake fallbacks; raises UpstreamError if database is unavailable.
        """
        try:
            res = (
                supabase.table("crops")
                .select("*")
                .not_.is_("stages", "null")
                .order("name")
                .execute()
            )
            items = res.data or []
            return [CropCatalogItem(**item) for item in items]
        except Exception:
            logger.exception("Failed to query crops catalog from database")
            raise UpstreamError("Crops catalog temporarily unavailable")

    @staticmethod
    def find_catalog_crop_by_name(query_name: str) -> Optional[CropCatalogItem]:
        """
        Matches a spoken or text query against catalog crop name, hindi_name,
        marathi_name, or aliases.
        """
        if not query_name:
            return None
        q = query_name.strip().lower()

        try:
            catalog = CropService.get_catalog()
            for crop in catalog:
                candidates = [
                    crop.name.lower(),
                    crop.hindi_name.lower(),
                    crop.marathi_name.lower(),
                ] + [a.lower() for a in crop.aliases]
                if any(q in c or c in q for c in candidates):
                    return crop
        except Exception:
            logger.warning(f"Could not search catalog for name '{query_name}'", exc_info=True)

        return None

    @staticmethod
    def get_user_crops(user_id: str) -> List[UserCropResponse]:
        """
        Returns all crops belonging to the user directly, with computed growth progress
        and dynamic status ('needs_care' / 'on_track').
        """
        try:
            crops_res = (
                supabase.table("farm_crops")
                .select("*, crops(name, hindi_name, marathi_name, icon, category, stages)")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            user_crops_data = crops_res.data or []

            if not user_crops_data:
                return []

            crop_ids = [c["id"] for c in user_crops_data]

            # Batch query tasks for these crops
            tasks_res = (
                supabase.table("farm_crop_tasks")
                .select("*")
                .in_("farm_crop_id", crop_ids)
                .eq("user_id", user_id)
                .execute()
            )
            tasks_data = tasks_res.data or []

            # Batch query diagnoses for these crops
            diag_res = (
                supabase.table("diagnoses")
                .select("*")
                .in_("farm_crop_id", crop_ids)
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            diag_data = diag_res.data or []

        except Exception:
            logger.exception(f"Failed to query crops for user {user_id}")
            raise UpstreamError("Database unavailable")

        tasks_by_crop = defaultdict(list)
        for t in tasks_data:
            tasks_by_crop[t["farm_crop_id"]].append(t)

        diag_by_crop = defaultdict(list)
        for d in diag_data:
            diag_by_crop[d["farm_crop_id"]].append(d)

        now = datetime.now(timezone.utc)
        result: List[UserCropResponse] = []

        for c in user_crops_data:
            cat = c.get("crops") or {}
            crop_tasks = tasks_by_crop[c["id"]]
            crop_diags = diag_by_crop[c["id"]]

            # Compute progress if planted_date and stages are known
            planted_d: Optional[date] = None
            if c.get("planted_date"):
                try:
                    planted_d = date.fromisoformat(str(c["planted_date"]))
                except Exception:
                    pass

            stages_data = cat.get("stages")
            prog = compute_progress(planted_d, stages_data) or {}

            # Status is 'needs_care' if any overdue high task or unresolved diagnosis
            unresolved = [d for d in crop_diags if not d.get("resolved_at")]
            status_val = "needs_care" if needs_care(crop_tasks, unresolved, now) else "on_track"

            # Latest issue summary
            latest_issue = None
            if crop_diags:
                top_diag = crop_diags[0]
                latest_issue = {
                    "id": top_diag.get("id"),
                    "disease_name": top_diag.get("disease_name"),
                    "severity": top_diag.get("severity"),
                    "resolved": bool(top_diag.get("resolved_at")),
                    "created_at": top_diag.get("created_at"),
                }

            crop_name = cat.get("name") or c.get("custom_name") or "Crop"

            result.append(
                UserCropResponse(
                    id=c["id"],
                    user_id=c["user_id"],
                    crop_type_id=c.get("crop_type_id"),
                    name=crop_name,
                    hindi_name=cat.get("hindi_name"),
                    marathi_name=cat.get("marathi_name"),
                    variety=c.get("variety"),
                    acreage=float(c["acreage"]) if c.get("acreage") is not None else None,
                    category=cat.get("category", "General"),
                    icon=cat.get("icon", "🌱"),
                    planted_date=str(c["planted_date"]) if c.get("planted_date") else None,
                    days_since_planted=prog.get("days_since_planted"),
                    percent_complete=prog.get("percent_complete"),
                    days_to_harvest=prog.get("days_to_harvest"),
                    past_cycle=prog.get("past_cycle"),
                    stage_key=prog.get("stage_key"),
                    stages=prog.get("stages"),
                    reported_stage=c.get("reported_stage"),
                    status=status_val,
                    latest_issue=latest_issue,
                    notes=c.get("notes"),
                    source=c.get("source", "manual"),
                    created_at=c.get("created_at"),
                )
            )

        return result

    @staticmethod
    def get_user_crop_detail(crop_id: str, user_id: str) -> UserCropDetailResponse:
        """
        Retrieves detailed view for a single crop, including its full diagnosis history
        (with signed private image URLs) and care tasks.
        """
        try:
            crop_res = (
                supabase.table("farm_crops")
                .select("*, crops(name, hindi_name, marathi_name, icon, category, stages)")
                .eq("id", crop_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            if not crop_res.data:
                raise NotFound("Crop")

            c = crop_res.data[0]
            cat = c.get("crops") or {}

            # Query crop tasks
            tasks_res = (
                supabase.table("farm_crop_tasks")
                .select("*")
                .eq("farm_crop_id", crop_id)
                .eq("user_id", user_id)
                .order("created_at")
                .execute()
            )
            tasks = tasks_res.data or []

            # Query crop diagnoses history
            diag_res = (
                supabase.table("diagnoses")
                .select("*")
                .eq("farm_crop_id", crop_id)
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            raw_diags = diag_res.data or []

        except NotFound:
            raise
        except Exception:
            logger.exception(f"Failed to fetch crop detail for {crop_id}")
            raise UpstreamError("Database unavailable")

        # Process signed image URLs for private images
        processed_diags = []
        for d in raw_diags:
            diag_dict = dict(d)
            img_path = diag_dict.get("image_path") or diag_dict.get("image_url")
            diag_dict["image_url"] = storage_service.get_signed_image_url(img_path)
            diag_dict["resolved"] = bool(diag_dict.get("resolved_at"))
            processed_diags.append(diag_dict)

        planted_d: Optional[date] = None
        if c.get("planted_date"):
            try:
                planted_d = date.fromisoformat(str(c["planted_date"]))
            except Exception:
                pass

        prog = compute_progress(planted_d, cat.get("stages")) or {}
        now = datetime.now(timezone.utc)
        unresolved = [d for d in raw_diags if not d.get("resolved_at")]
        status_val = "needs_care" if needs_care(tasks, unresolved, now) else "on_track"

        crop_name = cat.get("name") or c.get("custom_name") or "Crop"

        return UserCropDetailResponse(
            id=c["id"],
            user_id=c["user_id"],
            crop_type_id=c.get("crop_type_id"),
            name=crop_name,
            hindi_name=cat.get("hindi_name"),
            marathi_name=cat.get("marathi_name"),
            variety=c.get("variety"),
            acreage=float(c["acreage"]) if c.get("acreage") is not None else None,
            category=cat.get("category", "General"),
            icon=cat.get("icon", "🌱"),
            planted_date=str(c["planted_date"]) if c.get("planted_date") else None,
            days_since_planted=prog.get("days_since_planted"),
            percent_complete=prog.get("percent_complete"),
            days_to_harvest=prog.get("days_to_harvest"),
            past_cycle=prog.get("past_cycle"),
            stage_key=prog.get("stage_key"),
            stages=prog.get("stages"),
            reported_stage=c.get("reported_stage"),
            status=status_val,
            latest_issue=processed_diags[0] if processed_diags else None,
            notes=c.get("notes"),
            source=c.get("source", "manual"),
            created_at=c.get("created_at"),
            tasks=tasks,
            diagnoses=processed_diags,
        )

    @staticmethod
    def create_user_crop(user_id: str, data: UserCropCreate) -> UserCropResponse:
        """
        Creates a new crop directly in the farmer's account.
        Validates catalog reference if crop_type_id is supplied.
        """
        # If crop_type_id provided, verify catalog existence or resolve prefix
        if data.crop_type_id:
            normalized_id = data.crop_type_id if data.crop_type_id.startswith("crop-") else f"crop-{data.crop_type_id}"
            try:
                cat_res = (
                    supabase.table("crops")
                    .select("id, stages")
                    .or_(f"id.eq.{data.crop_type_id},id.eq.{normalized_id}")
                    .limit(1)
                    .execute()
                )
                if cat_res.data:
                    data.crop_type_id = cat_res.data[0]["id"]
                else:
                    # If not found in catalog, treat as a custom crop gracefully
                    if not data.custom_name:
                        data.custom_name = data.crop_type_id.replace("crop-", "").capitalize()
                    data.crop_type_id = None
            except Exception:
                logger.exception("Catalog validation failed, treating as custom crop")
                if not data.custom_name:
                    data.custom_name = data.crop_type_id.replace("crop-", "").capitalize()
                data.crop_type_id = None

        row = {
            "user_id": user_id,
            "crop_type_id": data.crop_type_id,
            "custom_name": data.custom_name,
            "variety": data.variety,
            "acreage": data.acreage,
            "planted_date": str(data.planted_date) if data.planted_date else None,
            "reported_stage": data.reported_stage,
            "notes": data.notes,
            "source": data.source,
        }

        try:
            res = supabase.table("farm_crops").insert(row).execute()
            if not res.data:
                raise UpstreamError("Failed to create crop")
            created_row = res.data[0]
        except UpstreamError:
            raise
        except Exception:
            logger.exception("Failed to insert user crop")
            raise UpstreamError("Database unavailable")

        # Return refreshed crop view
        return CropService.get_user_crop_detail(created_row["id"], user_id)

    @staticmethod
    def update_user_crop(crop_id: str, user_id: str, data: UserCropUpdate) -> UserCropResponse:
        """
        Updates crop fields (custom_name, variety, acreage, planted_date, reported_stage, notes).
        Ensures strict user ownership check in the query.
        """
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise ValueError("No fields provided for update")

        if "planted_date" in update_data and update_data["planted_date"] is not None:
            update_data["planted_date"] = str(update_data["planted_date"])

        try:
            res = (
                supabase.table("farm_crops")
                .update(update_data)
                .eq("id", crop_id)
                .eq("user_id", user_id)
                .execute()
            )
            if not res.data:
                raise NotFound("Crop")
        except NotFound:
            raise
        except Exception:
            logger.exception(f"Failed to update crop {crop_id}")
            raise UpstreamError("Database unavailable")

        return CropService.get_user_crop_detail(crop_id, user_id)

    @staticmethod
    def delete_user_crop(crop_id: str, user_id: str) -> bool:
        """
        Deletes a crop belonging to the user.
        """
        try:
            res = (
                supabase.table("farm_crops")
                .delete()
                .eq("id", crop_id)
                .eq("user_id", user_id)
                .execute()
            )
            if not res.data:
                raise NotFound("Crop")
            return True
        except NotFound:
            raise
        except Exception:
            logger.exception(f"Failed to delete crop {crop_id}")
            raise UpstreamError("Database unavailable")


crop_service = CropService()
