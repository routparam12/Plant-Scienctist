import io
import mimetypes
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_optional_user
from app.services.storage_service import storage_service, ALLOWED_MIME_TYPES

router = APIRouter(
    prefix="/media",
    tags=["Media Upload & Storage"],
)


@router.post("/upload")
async def upload_media_file(
    file: UploadFile = File(...),
    category: Optional[str] = Form("media"),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Unified Presigned / Direct Media Upload:
    Accepts audio (.m4a, .mp3, .wav, .webm), photos, or video frames (.jpg, .png, .webp).
    Returns media_id to pass into /v1/assistant/message.
    """
    if not file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded.")

    content_type = file.content_type or "application/octet-stream"
    clean_mime = content_type.lower().split(";")[0].strip()

    # Determine mime from filename if octet-stream
    if clean_mime == "application/octet-stream" and file.filename:
        guessed, _ = mimetypes.guess_type(file.filename)
        if guessed:
            clean_mime = guessed

    try:
        media_bytes = await file.read()
        if not media_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

        user_id = current_user.get("sub") if current_user else None
        media_id = storage_service.upload_media(
            user_id=user_id,
            media_bytes=media_bytes,
            content_type=clean_mime,
            category=category or "media",
        )

        if not media_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to persist uploaded media file.",
            )

        signed_url = storage_service.get_signed_media_url(media_id)

        return {
            "success": True,
            "media_id": media_id,
            "url": signed_url,
            "content_type": clean_mime,
            "filename": file.filename,
            "size": len(media_bytes),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Media upload error: {str(e)}",
        )


@router.get("/{media_path:path}")
async def get_media_stream(media_path: str):
    """
    Streams media file for playback or preview.
    """
    media_bytes = storage_service.get_media_bytes(media_path)
    if not media_bytes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found.")

    guessed_type, _ = mimetypes.guess_type(media_path)
    if not guessed_type:
        if media_path.endswith(".m4a"):
            guessed_type = "audio/m4a"
        elif media_path.endswith(".mp3"):
            guessed_type = "audio/mpeg"
        elif media_path.endswith(".wav"):
            guessed_type = "audio/wav"
        else:
            guessed_type = "image/jpeg"

    return StreamingResponse(
        io.BytesIO(media_bytes),
        media_type=guessed_type,
        headers={"Content-Length": str(len(media_bytes))},
    )
