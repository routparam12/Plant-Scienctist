from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    total_acreage: float = Field(default=1.0, gt=0)
    soil_type: Optional[str] = "Alluvial Loam"


class FarmCropTask(BaseModel):
    id: str
    title: str
    hindi_title: Optional[str] = None
    marathi_title: Optional[str] = None
    type: str = "Spraying"
    due_date: str = "This week"
    priority: str = "Medium"
    completed: bool = False
    notes: Optional[str] = None


class FarmCropCreate(BaseModel):
    crop_type_id: Optional[str] = None
    name: str
    hindi_name: Optional[str] = None
    marathi_name: Optional[str] = None
    variety: Optional[str] = None
    acreage: float = 1.0
    planted_date: Optional[date] = None
    stage: str = "Vegetative"
    category: Optional[str] = "General"
    icon: Optional[str] = "🌱"


class FarmCropUpdate(BaseModel):
    name: Optional[str] = None
    variety: Optional[str] = None
    acreage: Optional[float] = None
    stage: Optional[str] = None
    stage_progress: Optional[int] = None
    health_score: Optional[int] = None
    status: Optional[str] = None


class FarmCropResponse(BaseModel):
    id: str
    farm_id: str
    crop_type_id: Optional[str] = None
    name: str
    hindi_name: Optional[str] = None
    marathi_name: Optional[str] = None
    variety: Optional[str] = None
    acreage: float
    planted_date: str
    stage: str
    stage_progress: int
    health_score: int
    status: str
    category: Optional[str] = None
    icon: Optional[str] = None
    tasks: List[FarmCropTask] = []


class FarmResponse(BaseModel):
    id: str
    user_id: str
    name: str
    location: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    total_acreage: float
    soil_type: Optional[str] = None
    crops: List[FarmCropResponse] = []
    created_at: Optional[datetime] = None
