from typing import Optional
from app.core.supabase import supabase
from app.schemas.profile import ProfileUpdate


class ProfileService:

    @staticmethod
    def get_profile(user_id: str) -> Optional[dict]:
        """
        Fetches farmer profile from public.profiles table by user_id.
        """
        response = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @staticmethod
    def create_or_update_profile(user_id: str, data: ProfileUpdate) -> dict:
        """
        Updates farmer profile fields in public.profiles table.
        Does NOT allow mutating onboarding_completed directly from patch payload.
        """
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        update_data["id"] = user_id

        response = supabase.table("profiles").upsert(update_data).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        return update_data

    @staticmethod
    def complete_onboarding(user_id: str) -> dict:
        """
        Explicitly marks onboarding as completed for the authenticated farmer.
        """
        update_data = {
            "id": user_id,
            "onboarding_completed": True,
        }
        response = supabase.table("profiles").upsert(update_data).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        return update_data


profile_service = ProfileService()
