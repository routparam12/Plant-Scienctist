from typing import List
from fastapi import APIRouter, Depends, status
from app.core.dependencies import get_current_user
from app.schemas.crops import (
    CropCatalogItem,
    UserCropCreate,
    UserCropUpdate,
    UserCropResponse,
    UserCropDetailResponse,
)
from app.services.crop_service import crop_service

router = APIRouter(
    prefix="/crops",
    tags=["Farmer Crops & Catalog"],
)


@router.get("", response_model=List[UserCropResponse], summary="Get Farmer Crops")
def get_user_crops(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns all crops registered by the authenticated farmer,
    including computed growth stage, progress, and care status.
    """
    user_id = current_user.get("sub")
    return crop_service.get_user_crops(user_id)


@router.post("", response_model=UserCropResponse, status_code=status.HTTP_201_CREATED, summary="Add a Crop")
def create_user_crop(
    data: UserCropCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Adds a crop to the farmer's account manually, via leaf scan, or voice report.
    Planted date and acreage are optional.
    """
    user_id = current_user.get("sub")
    return crop_service.create_user_crop(user_id, data)


@router.get("/catalog", response_model=List[CropCatalogItem], summary="Get Master Crops Catalog")
def get_crops_catalog():
    """
    Returns the reference Indian crops catalog with growth duration,
    stage day intervals, and localized names.
    """
    return crop_service.get_catalog()


@router.get("/{crop_id}", response_model=UserCropDetailResponse, summary="Get Crop Detail View")
def get_user_crop_detail(
    crop_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Detailed crop record containing task list, diagnosis timeline,
    and private signed image URLs.
    """
    user_id = current_user.get("sub")
    return crop_service.get_user_crop_detail(crop_id, user_id)


@router.patch("/{crop_id}", response_model=UserCropResponse, summary="Update Crop Details")
def update_user_crop(
    crop_id: str,
    data: UserCropUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Updates crop variety, acreage, planted date, or notes.
    """
    user_id = current_user.get("sub")
    return crop_service.update_user_crop(crop_id, user_id, data)


@router.delete("/{crop_id}", summary="Delete Crop")
def delete_user_crop(
    crop_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Removes a crop from the farmer's account.
    """
    user_id = current_user.get("sub")
    crop_service.delete_user_crop(crop_id, user_id)
    return {"success": True, "message": "Crop removed successfully"}
