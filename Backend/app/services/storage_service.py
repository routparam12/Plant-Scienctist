import uuid
import logging
from typing import Optional
from app.core.supabase import supabase

logger = logging.getLogger(__name__)

BUCKET_NAME = "crop-images"
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


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
    def upload_crop_image(
        user_id: str,
        crop_id: Optional[str],
        image_bytes: bytes,
        content_type: str = "image/jpeg",
    ) -> Optional[str]:
        """
        Uploads crop image to private Supabase Storage at:
        crop-images/{user_id}/{crop_id or 'unassigned'}/{uuid}.jpg
        Returns relative storage path on success.
        """
        if not image_bytes or len(image_bytes) > MAX_FILE_SIZE:
            logger.warning("Image upload rejected: empty or exceeds 10MB limit")
            return None

        clean_mime = content_type.lower().split(";")[0].strip()
        if clean_mime not in ALLOWED_MIME_TYPES:
            clean_mime = "image/jpeg"

        ext = "png" if "png" in clean_mime else "webp" if "webp" in clean_mime else "jpg"
        folder = crop_id if crop_id else "unassigned"
        file_path = f"{user_id}/{folder}/{uuid.uuid4()}.{ext}"

        try:
            StorageService._ensure_bucket()
            res = supabase.storage.from_(BUCKET_NAME).upload(
                file_path,
                image_bytes,
                file_options={"content-type": clean_mime, "upsert": "false"},
            )
            return file_path
        except Exception as e:
            logger.exception(f"Failed to upload image to Supabase Storage: {e}")
            return None

    @staticmethod
    def get_signed_image_url(file_path: Optional[str], expires_in: int = 3600) -> Optional[str]:
        """
        Generates a short-lived signed URL for private image viewing.
        If file_path is already an HTTP URL (legacy), returns it as-is.
        """
        if not file_path:
            return None

        if file_path.startswith("http://") or file_path.startswith("https://"):
            return file_path

        try:
            res = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_path, expires_in)
            if isinstance(res, dict) and "signedURL" in res:
                return res["signedURL"]
            elif hasattr(res, "signed_url"):
                return res.signed_url
            elif isinstance(res, str):
                return res
            elif isinstance(res, dict) and "signed_url" in res:
                return res["signed_url"]
        except Exception as e:
            logger.warning(f"Could not create signed URL for path '{file_path}': {e}")

        return None


storage_service = StorageService()
