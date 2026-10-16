from typing import Optional
from app.core.supabase import supabase
from app.schemas.profile import ProfileUpdate

REQUIRED_ONBOARDING_FIELDS = ["full_name"]


class ProfileService:

    @staticmethod
    def get_profile(user_id: str) -> Optional[dict]:
        """
        Fetches farmer profile from public.profiles table by user_id.
        Returns None if user row does not exist, or if table is not yet created in Supabase (PGRST205).
        Re-raises other actual database errors.
        """
        try:
            response = supabase.table("profiles").select("*").eq("id", user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            err_dict = getattr(e, "args", [{}])[0] if getattr(e, "args", None) else {}
            code = err_dict.get("code") if isinstance(err_dict, dict) else None
            if code == "PGRST205" or "PGRST205" in str(e):
                print(f"[ProfileService] Notice: 'public.profiles' table not found in Supabase (PGRST205). Run schema.sql in Supabase SQL editor.")
                return None
            print(f"[ProfileService] Database error fetching profile: {e}")
            raise

    @staticmethod
    def check_onboarding_status(profile_data: dict) -> bool:
        """
        Validates if core onboarding field (full_name) is present and non-empty.
        """
        name = profile_data.get("full_name")
        return bool(name and str(name).strip())

    @staticmethod
    def create_or_update_profile(user_id: str, data: ProfileUpdate) -> dict:
        """
        Updates farmer profile fields in public.profiles table.
        If full_name is present, automatically sets onboarding_completed = True.
        """
        existing = ProfileService.get_profile(user_id) or {}
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["id"] = user_id

        # Merge existing data with incoming updates
        merged = {**existing, **update_data}
        if ProfileService.check_onboarding_status(merged):
            update_data["onboarding_completed"] = True

        try:
            response = supabase.table("profiles").upsert(update_data).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return {**existing, **update_data}
        except Exception as e:
            err_dict = getattr(e, "args", [{}])[0] if getattr(e, "args", None) else {}
            code = err_dict.get("code") if isinstance(err_dict, dict) else None
            if code == "PGRST205" or "PGRST205" in str(e):
                print(f"[ProfileService] Notice: 'public.profiles' table missing. Run schema.sql.")
                return {**existing, **update_data}
            print(f"[ProfileService] Database error updating profile: {e}")
            raise

    @staticmethod
    def complete_onboarding(user_id: str) -> dict:
        """
        Explicitly marks farmer onboarding as completed (onboarding_completed = true).
        Zero-friction: does not reject or throw 400 for optional location details.
        """
        profile = ProfileService.get_profile(user_id) or {}
        update_data = {
            "id": user_id,
            "onboarding_completed": True,
        }
        try:
            response = supabase.table("profiles").upsert(update_data).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return {**profile, "onboarding_completed": True}
        except Exception as e:
            err_dict = getattr(e, "args", [{}])[0] if getattr(e, "args", None) else {}
            code = err_dict.get("code") if isinstance(err_dict, dict) else None
            if code == "PGRST205" or "PGRST205" in str(e):
                print(f"[ProfileService] Notice: 'public.profiles' table missing. Run schema.sql.")
                return {**profile, "onboarding_completed": True}
            print(f"[ProfileService] Database error completing onboarding: {e}")
            raise


profile_service = ProfileService()
