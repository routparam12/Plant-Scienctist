from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.schemas.farms import (
    FarmCreate,
    FarmResponse,
    FarmCropCreate,
    FarmCropUpdate,
)
from app.services.farm_service import farm_service

router = APIRouter(
    prefix="/farms",
    tags=["Farms & Crops"],
)


@router.get("", response_model=List[FarmResponse], summary="Get Farmer Farms & Crops")
async def get_farms(
    current_user: dict = Depends(get_current_user),
):
    """
    Fetches all farms registered by the authenticated farmer, including
    associated crops, stage progress, and care tasks.
    """
    user_id = current_user.get("sub")
    return farm_service.get_user_farms(user_id)


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a New Farm")
async def create_farm(
    data: FarmCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Registers a new farm plot with acreage and soil type.
    """
    user_id = current_user.get("sub")
    try:
        return farm_service.create_farm(user_id, data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create farm: {str(exc)}",
        ) from exc


@router.post("/{farm_id}/crops", status_code=status.HTTP_201_CREATED, summary="Add Crop to Farm")
async def add_crop_to_farm(
    farm_id: str,
    data: FarmCropCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Adds a crop (e.g. Tomato, Wheat, Cotton) to an existing farm plot.
    Automatically generates starter care tasks.
    """
    user_id = current_user.get("sub")
    try:
        return farm_service.add_crop_to_farm(farm_id, user_id, data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add crop: {str(exc)}",
        ) from exc


@router.patch("/{farm_id}/crops/{crop_id}", summary="Update Farm Crop")
async def update_crop(
    farm_id: str,
    crop_id: str,
    data: FarmCropUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Updates crop growth stage, stage progress, health score, or variety.
    """
    user_id = current_user.get("sub")
    try:
        return farm_service.update_crop(farm_id, crop_id, user_id, data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update crop: {str(exc)}",
        ) from exc


@router.delete("/{farm_id}/crops/{crop_id}", summary="Delete Farm Crop")
async def delete_crop(
    farm_id: str,
    crop_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Removes a crop from the farm.
    """
    user_id = current_user.get("sub")
    try:
        success = farm_service.delete_crop(farm_id, crop_id, user_id)
        return {"success": success, "message": "Crop removed successfully"}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete crop: {str(exc)}",
        ) from exc
