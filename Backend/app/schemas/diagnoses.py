from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DiagnosticResultResponse(BaseModel):
    id: Optional[str] = None
    farm_crop_id: Optional[str] = None
    disease_name: str
    scientific_name: Optional[str] = None
    crop: str
    crop_suggestion: Optional[Dict[str, Any]] = None
    pathogen_type: str = "Unknown"
    severity: str = "Moderate"
    severity_score: int = 50
    confidence_score: float = 90.0
    symptoms: List[str] = []
    organic_remedies: List[str] = []
    chemical_treatments: List[str] = []
    preventive_measures: List[str] = []
    advisory_note: Optional[str] = None
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    user_notes: Optional[str] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class DiagnosisResolveRequest(BaseModel):
    resolved: bool = True


class DiagnosisTextQuery(BaseModel):
    notes: str
    crop: Optional[str] = "Crop"
    language: Optional[str] = "en"
    specimen_hint: Optional[str] = None
