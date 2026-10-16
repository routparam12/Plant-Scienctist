from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=150, description="Farmer's full name")
    phone: Optional[str] = Field(None, max_length=20, description="Farmer's phone number")
    preferred_language: Optional[str] = Field(None, max_length=10, description="Preferred language code (e.g., hi, en, ta, mr)")
    state: Optional[str] = Field(None, max_length=100, description="Farmer's state")
    district: Optional[str] = Field(None, max_length=100, description="Farmer's district")
    village: Optional[str] = Field(None, max_length=150, description="Farmer's village")
    total_acreage: Optional[float] = Field(None, ge=0.0, description="Farmer's total land holding in acres")
    latitude: Optional[float] = Field(None, description="Farmer's GPS latitude")
    longitude: Optional[float] = Field(None, description="Farmer's GPS longitude")


class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: str = "hi"
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    total_acreage: Optional[float] = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    onboarding_completed: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
