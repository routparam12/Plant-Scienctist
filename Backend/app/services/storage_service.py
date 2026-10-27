import os
import uuid
import logging
from pathlib import Path
from typing import Optional
from app.core.supabase import supabase

logger = logging.getLogger(__name__)

BUCKET_NAME = "crop-images"
LOCAL_UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
LOCAL_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
}

ALLOWED_AUDIO_MIME_TYPES = {
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4",
    "audio/aac",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
}

ALLOWED_MIME_TYPES = ALLOWED_IMAGE_MIME_TYPES | ALLOWED_AUDIO_MIME_TYPES
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


class StorageService:
    @staticmethod
    def _ensure_bucket():
        """
        Attempts to ensure the private bucket exists.
        """
        try:
            supabase.storage.get_bucket(BUCKET_NAME)
        except Exception:
            try:
                supabase.storage.create_bucket(BUCKET_NAME, options={"public": False})
            except Exception as e:
                logger.debug(f"Bucket create/check notice: {e}")

    @staticmethod
    def _mime_to_extension(content_type: str) -> str:
        clean = content_type.lower().split(";")[0].strip()
        if "png" in clean:
            return "png"
        if "webp" in clean:
            return "webp"
        if "m4a" in clean or "aac" in clean or "mp4" in clean:
            return "m4a"
        if "wav" in clean:
            return "wav"
        if "mpeg" in clean or "mp3" in clean:
            return "mp3"
        if "webm" in clean:
            return "webm"
        if "ogg" in clean:
            return "ogg"
        return "jpg"

    @staticmethod
    def upload_media(
        user_id: Optional[str],
        media_bytes: bytes,
        content_type: str = "image/jpeg",
        category: str = "media",
    ) -> Optional[str]:
        """
        Unified upload for all media types (audio, photos, frames).
        Stores in Supabase Storage with local resilient fallback.
        Returns a relative media_id path.
        """
        if not media_bytes or len(media_bytes) > MAX_FILE_SIZE:
            logger.warning("Media upload rejected: empty or exceeds max file size limit")
            return None

        clean_mime = content_type.lower().split(";")[0].strip()
        if clean_mime not in ALLOWED_MIME_TYPES:
            clean_mime = "application/octet-stream"

        ext = StorageService._mime_to_extension(clean_mime)
        user_folder = user_id or "anonymous"
        media_uuid = str(uuid.uuid4())
        file_path = f"{user_folder}/{category}/{media_uuid}.{ext}"

        # 1. Local disk resilient cache (ensures offline/dev test works 100%)
        try:
            local_target = LOCAL_UPLOADS_DIR / user_folder / category / f"{media_uuid}.{ext}"
            local_target.parent.mkdir(parents=True, exist_ok=True)
            local_target.write_bytes(media_bytes)
        except Exception as local_err:
            logger.warning(f"Failed to cache media locally: {local_err}")

        # 2. Upload to Supabase Storage
        try:
            StorageService._ensure_bucket()
            supabase.storage.from_(BUCKET_NAME).upload(
                file_path,
                media_bytes,
                file_options={"content-type": clean_mime, "upsert": "false"},
            )
            return file_path
        except Exception as e:
            logger.info(f"Supabase Storage notice (using local file path fallback): {e}")
            # If Supabase is unreachable, return relative local path as media_id
            return file_path

    @staticmethod
    def upload_crop_image(
        user_id: str,
        crop_id: Optional[str],
        image_bytes: bytes,
        content_type: str = "image/jpeg",
    ) -> Optional[str]:
        """Backward-compatible crop image uploader."""
        folder = crop_id if crop_id else "unassigned"
        return StorageService.upload_media(
            user_id=user_id,
            media_bytes=image_bytes,
            content_type=content_type,
            category=folder,
        )

    @staticmethod
    def get_media_bytes(media_id: Optional[str]) -> Optional[bytes]:
        """
        Retrieves raw media bytes by media_id from local disk or Supabase storage.
        """
        if not media_id:
            return None

        # Check local storage first
        local_path = LOCAL_UPLOADS_DIR / media_id.replace("/", os.sep)
        if local_path.is_file():
            try:
                return local_path.read_bytes()
            except Exception as e:
                logger.warning(f"Error reading local media {local_path}: {e}")

        # Download from Supabase Storage
        try:
            res = supabase.storage.from_(BUCKET_NAME).download(media_id)
            if isinstance(res, bytes):
                return res
            if hasattr(res, "content"):
                return res.content
        except Exception as e:
            logger.warning(f"Could not download media '{media_id}' from Supabase: {e}")

        return None

    @staticmethod
    def get_signed_image_url(file_path: Optional[str], expires_in: int = 3600) -> Optional[str]:
        """Generates a short-lived signed URL or local media URL for media viewing."""
        return StorageService.get_signed_media_url(file_path, expires_in)

    @staticmethod
    def get_signed_media_url(media_id: Optional[str], expires_in: int = 3600) -> Optional[str]:
        """
        Generates a signed URL for media (audio or image) viewing / playback.
        """
        if not media_id:
            return None

        if media_id.startswith("http://") or media_id.startswith("https://"):
            return media_id

        try:
            res = supabase.storage.from_(BUCKET_NAME).create_signed_url(media_id, expires_in)
            if isinstance(res, dict) and "signedURL" in res:
                return res["signedURL"]
            elif hasattr(res, "signed_url"):
                return res.signed_url
            elif isinstance(res, str):
                return res
            elif isinstance(res, dict) and "signed_url" in res:
                return res["signed_url"]
        except Exception as e:
            logger.debug(f"Could not create signed Supabase URL for path '{media_id}': {e}")

        # Fallback to local API media streaming route
        return f"/v1/media/{media_id}"


storage_service = StorageService()

