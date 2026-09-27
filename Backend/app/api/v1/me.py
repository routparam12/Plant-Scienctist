from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.profile import profile_service

router = APIRouter(
    prefix="/me",
    tags=["Farmer Profile"],
)


@router.get("", response_model=ProfileResponse, summary="Get Authenticated Farmer Profile")
async def get_me(
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieves the authenticated farmer's profile data.
    FastAPI extracts auth.uid() from the verified Supabase JWT Bearer token.
    """
    user_id = current_user.get("sub")
    profile = profile_service.get_profile(user_id)

    if not profile:
        # Fallback profile if record does not exist yet in db
        return ProfileResponse(
            id=user_id,
            full_name=current_user.get("email", "").split("@")[0] if current_user.get("email") else None,
            preferred_language="hi",
            onboarding_completed=False,
        )

    return profile


@router.patch("", response_model=ProfileResponse, summary="Update Authenticated Farmer Profile")
async def update_me(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Updates farmer profile fields (full_name, preferred_language, state, district).
    User identity is controlled by authentication JWT rather than client payload.
    """
    user_id = current_user.get("sub")
    try:
        updated_profile = profile_service.create_or_update_profile(user_id, data)
        return updated_profile
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile",
        ) from exc


@router.post("/onboarding/complete", response_model=ProfileResponse, summary="Complete Farmer Onboarding")
async def complete_onboarding(
    current_user: dict = Depends(get_current_user),
):
    """
    Explicitly marks farmer onboarding as completed (onboarding_completed = true).
    """
    user_id = current_user.get("sub")
    try:
        updated_profile = profile_service.complete_onboarding(user_id)
        return updated_profile
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to complete onboarding",
        ) from exc
