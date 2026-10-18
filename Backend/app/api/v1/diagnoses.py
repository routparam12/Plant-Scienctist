from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.dependencies import get_current_user
from app.core.security import verify_access_token
from app.schemas.diagnoses import DiagnosticResultResponse, DiagnosisResolveRequest
from app.services.diagnosis_service import diagnosis_service

router = APIRouter(
    prefix="/diagnoses",
    tags=["Crop Pathology & Diagnoses"],
)

optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
) -> Optional[dict]:
    if not credentials or not credentials.credentials:
        return None
    try:
        return await verify_access_token(credentials.credentials)
    except Exception:
        return None


@router.post("", response_model=DiagnosticResultResponse, summary="Diagnose Plant Pathology Specimen")
async def diagnose_crop_specimen(
    image: Optional[UploadFile] = File(None),
    notes: Optional[str] = Form(default=""),
    crop: Optional[str] = Form(default="Crop"),
    language: Optional[str] = Form(default="en"),
    farm_crop_id: Optional[str] = Form(default=None),
    user_payload: Optional[dict] = Depends(get_optional_user),
):
    """
    Multimodal Plant Pathology Diagnostic Pipeline:
    1. Receives crop pathology image from mobile camera or gallery (JPEG/PNG/WEBP).
    2. Runs Gemini vision analysis or ICAR calibrated specimen model.
    3. Saves specimen image to private crop-images bucket and links to crop if provided.
    4. Returns structured diagnosis, treatment steps, and suggested crop matching.
    """
    image_bytes = None
    content_type = "image/jpeg"

    if image is not None:
        try:
            image_bytes = await image.read()
            if image.content_type:
                content_type = image.content_type
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read uploaded image: {str(exc)}",
            ) from exc

    user_id = user_payload.get("sub") if user_payload else None

    try:
        result = await diagnosis_service.diagnose_crop(
            image_bytes=image_bytes,
            image_content_type=content_type,
            user_notes=notes,
            crop_hint=crop,
            language=language or "en",
            user_id=user_id,
            farm_crop_id=farm_crop_id,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnostic analysis error: {str(exc)}",
        ) from exc


@router.get("", response_model=List[DiagnosticResultResponse], summary="Get Past Diagnoses History")
async def get_diagnosis_history(
    user_payload: Optional[dict] = Depends(get_optional_user),
):
    """
    Retrieves past pathology diagnostic records for the farmer.
    """
    if not user_payload or not user_payload.get("sub"):
        return []
    user_id = user_payload.get("sub")
    return diagnosis_service.get_user_diagnoses(user_id)


@router.patch("/{diagnosis_id}", response_model=DiagnosticResultResponse, summary="Mark Diagnosis Issue Resolved")
def resolve_diagnosis(
    diagnosis_id: str,
    data: DiagnosisResolveRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Marks a plant disease/issue as resolved or active.
    """
    user_id = current_user.get("sub")
    return diagnosis_service.resolve_diagnosis(diagnosis_id, user_id, data.resolved)
