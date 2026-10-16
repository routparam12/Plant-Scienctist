from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator
from app.services.crop_progress import today_ist


class CropCatalogItem(BaseModel):
    id: str
    name: str
    hindi_name: str
    marathi_name: str
    variety: str = "Standard"
    category: str = "General"
    icon: str = "🌱"
    season: Optional[str] = None
    growth_duration_days: Optional[int] = None
    stages: Optional[List[Dict[str, Any]]] = None
    aliases: List[str] = []


class UserCropCreate(BaseModel):
    crop_type_id: Optional[str] = None
    custom_name: Optional[str] = None
    variety: Optional[str] = None
    acreage: Optional[float] = Field(None, gt=0, le=1000)
    planted_date: Optional[date] = None
    reported_stage: Optional[str] = None
    notes: Optional[str] = None
    source: str = Field(default="manual")

    @model_validator(mode="after")
    def validate_crop_identity(self):
        if not self.crop_type_id and not self.custom_name:
            raise ValueError("Either 'crop_type_id' or 'custom_name' must be provided to identify the crop")
        if self.source not in ("manual", "diagnosis", "voice"):
            raise ValueError("Source must be one of 'manual', 'diagnosis', or 'voice'")
        if self.planted_date:
            max_future = today_ist() + timedelta(days=30)
            if self.planted_date > max_future:
                raise ValueError("Planted date cannot be more than 30 days in the future")
        return self


class UserCropUpdate(BaseModel):
    custom_name: Optional[str] = None
    variety: Optional[str] = None
    acreage: Optional[float] = Field(None, gt=0, le=1000)
    planted_date: Optional[date] = None
    reported_stage: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_update(self):
        if self.planted_date:
            max_future = today_ist() + timedelta(days=30)
            if self.planted_date > max_future:
                raise ValueError("Planted date cannot be more than 30 days in the future")
        return self


class UserCropResponse(BaseModel):
    id: str
    user_id: str
    crop_type_id: Optional[str] = None
    name: str
    hindi_name: Optional[str] = None
    marathi_name: Optional[str] = None
    variety: Optional[str] = None
    acreage: Optional[float] = None
    category: Optional[str] = "General"
    icon: Optional[str] = "🌱"
    planted_date: Optional[str] = None
    days_since_planted: Optional[int] = None
    percent_complete: Optional[int] = None
    days_to_harvest: Optional[int] = None
    past_cycle: Optional[bool] = None
    stage_key: Optional[str] = None
    stages: Optional[List[Dict[str, Any]]] = None
    reported_stage: Optional[str] = None
    status: str = "on_track"
    latest_issue: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    source: str = "manual"
    created_at: Optional[datetime] = None


class UserCropDetailResponse(UserCropResponse):
    tasks: List[Dict[str, Any]] = []
    diagnoses: List[Dict[str, Any]] = []
