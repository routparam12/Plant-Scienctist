from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=150, description="Farmer's full name")
    preferred_language: Optional[str] = Field(None, max_length=10, description="Preferred language code (e.g., hi, en, ta)")
    state: Optional[str] = Field(None, max_length=100, description="Farmer's state")
    district: Optional[str] = Field(None, max_length=100, description="Farmer's district")


class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    preferred_language: str = "hi"
    state: Optional[str] = None
    district: Optional[str] = None
    onboarding_completed: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
