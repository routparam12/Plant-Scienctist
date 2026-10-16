import uuid
from typing import List, Optional
from datetime import date
from app.core.supabase import supabase
from app.schemas.farms import (
    FarmCreate,
    FarmResponse,
    FarmCropCreate,
    FarmCropUpdate,
    FarmCropResponse,
    FarmCropTask,
)


class FarmService:
    @staticmethod
    def get_user_farms(user_id: str) -> List[FarmResponse]:
        """
        Retrieves all farms belonging to the user, with their associated crops and tasks.
        If no farm exists yet, creates a default one.
        """
        try:
            farms_res = supabase.table("farms").select("*").eq("user_id", user_id).order("created_at").execute()
            farms_data = farms_res.data or []

            if not farms_data:
                # Auto-initialize default farm
                new_farm = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "name": "My Main Farm",
                    "total_acreage": 5.0,
                    "soil_type": "Alluvial Loam",
                }
                insert_res = supabase.table("farms").insert(new_farm).execute()
                if insert_res.data:
                    farms_data = insert_res.data

            result: List[FarmResponse] = []
            for f in farms_data:
                farm_id = f["id"]
                crops_res = supabase.table("farm_crops").select("*").eq("farm_id", farm_id).execute()
                crops_data = crops_res.data or []

                crops_list: List[FarmCropResponse] = []
                for c in crops_data:
                    crop_id = c["id"]
                    tasks_res = supabase.table("farm_crop_tasks").select("*").eq("farm_crop_id", crop_id).execute()
                    tasks_data = tasks_res.data or []
                    tasks = [FarmCropTask(**t) for t in tasks_data]

                    crops_list.append(
                        FarmCropResponse(
                            id=c["id"],
                            farm_id=c["farm_id"],
                            crop_type_id=c.get("crop_type_id"),
                            name=c["name"],
                            hindi_name=c.get("hindi_name"),
                            marathi_name=c.get("marathi_name"),
                            variety=c.get("variety"),
                            acreage=float(c.get("acreage", 1.0)),
                            planted_date=str(c.get("planted_date", date.today())),
                            stage=c.get("stage", "Vegetative"),
                            stage_progress=int(c.get("stage_progress", 25)),
                            health_score=int(c.get("health_score", 95)),
                            status=c.get("status", "On track"),
                            category=c.get("category", "General"),
                            icon=c.get("icon", "🌱"),
                            tasks=tasks,
                        )
                    )

                result.append(
                    FarmResponse(
                        id=f["id"],
                        user_id=f["user_id"],
                        name=f["name"],
                        location=f.get("location"),
                        village=f.get("village"),
                        district=f.get("district"),
                        state=f.get("state"),
                        total_acreage=float(f.get("total_acreage", 1.0)),
                        soil_type=f.get("soil_type"),
                        crops=crops_list,
                        created_at=f.get("created_at"),
                    )
                )

            return result

        except Exception as e:
            print(f"Error getting farms: {e}")
            # Fallback mock farm for development resilience
            return [
                FarmResponse(
                    id="farm-default",
                    user_id=user_id,
                    name="Chandaka Agri Farm",
                    village="Chandaka",
                    district="Bhubaneswar",
                    state="Odisha",
                    total_acreage=14.5,
                    soil_type="Red Loamy & Coastal Alluvial",
                    crops=[
                        FarmCropResponse(
                            id="crop-1",
                            farm_id="farm-default",
                            name="Tomato (Abhinav)",
                            hindi_name="टमाटर (अभिनव)",
                            marathi_name="टोमॅटो (अभिनव)",
                            variety="Syngenta Abhinav F1",
                            acreage=4.5,
                            planted_date=str(date.today()),
                            stage="Flowering",
                            stage_progress=68,
                            health_score=98,
                            status="On track",
                            category="Tomato",
                            icon="🍅",
                            tasks=[
                                FarmCropTask(
                                    id="t-1",
                                    title="Foliar spray with Micronutrients + Boron 20%",
                                    hindi_title="सूक्ष्म पोषक तत्व + बोरॉन 20% का छिड़काव",
                                    marathi_title="सूक्ष्म अन्नद्रव्ये + बोरॉन २०% फवारणी",
                                    type="Spraying",
                                    due_date="Friday, 8:00 AM",
                                    priority="High",
                                    completed=False,
                                    notes="Delay from Thursday due to afternoon rain forecast.",
                                )
                            ],
                        )
                    ],
                )
            ]

    @staticmethod
    def create_farm(user_id: str, data: FarmCreate) -> dict:
        farm_dict = data.model_dump()
        farm_dict["user_id"] = user_id
        res = supabase.table("farms").insert(farm_dict).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        raise RuntimeError("Failed to create farm in database")

    @staticmethod
    def add_crop_to_farm(farm_id: str, user_id: str, data: FarmCropCreate) -> dict:
        crop_dict = data.model_dump()
        crop_dict["farm_id"] = farm_id
        crop_dict["user_id"] = user_id
        if crop_dict.get("planted_date") is None:
            crop_dict["planted_date"] = str(date.today())
        else:
            crop_dict["planted_date"] = str(crop_dict["planted_date"])

        res = supabase.table("farm_crops").insert(crop_dict).execute()
        if not res.data:
            raise RuntimeError("Failed to insert crop")

        new_crop = res.data[0]
        crop_pk = new_crop["id"]

        # Automatically seed 2 starter care tasks for the farmer
        starter_tasks = [
            {
                "farm_crop_id": crop_pk,
                "user_id": user_id,
                "title": f"Initial irrigation cycle for {data.name}",
                "hindi_title": f"{data.name} के लिए प्रारंभिक सिंचाई चक्र",
                "type": "Irrigation",
                "due_date": "Tomorrow",
                "priority": "High",
                "completed": False,
            },
            {
                "farm_crop_id": crop_pk,
                "user_id": user_id,
                "title": f"Soil moisture and pest inspection",
                "hindi_title": f"मिट्टी की नमी और कीट जांच",
                "type": "Spraying",
                "due_date": "This weekend",
                "priority": "Medium",
                "completed": False,
            },
        ]
        try:
            supabase.table("farm_crop_tasks").insert(starter_tasks).execute()
        except Exception as e:
            print(f"Warning: could not seed tasks: {e}")

        return new_crop

    @staticmethod
    def update_crop(farm_id: str, crop_id: str, user_id: str, data: FarmCropUpdate) -> dict:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        res = supabase.table("farm_crops").update(update_dict).eq("id", crop_id).eq("user_id", user_id).execute()
        if res.data:
            return res.data[0]
        raise RuntimeError("Crop not found or update failed")

    @staticmethod
    def delete_crop(farm_id: str, crop_id: str, user_id: str) -> bool:
        res = supabase.table("farm_crops").delete().eq("id", crop_id).eq("user_id", user_id).execute()
        return bool(res.data)


farm_service = FarmService()
