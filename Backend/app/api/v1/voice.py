import base64
import io
import logging
import re
import urllib.parse
from typing import Optional, Tuple
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.dependencies import get_optional_user
from app.core.supabase import supabase
from app.voice_module.stt import default_stt
from app.voice_module.tts import async_text_to_speech, detect_language
from app.voice_module.plant_advisor import get_plant_diagnosis

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/voice",
    tags=["Voice Assistant"],
)

# Comprehensive Indian crop alias dictionary for multi-tier matching
CROP_ALIASES = {
    "Tomato": ["tomato", "tamatar", "टमाटर", "टमाटार", "टोमॅटो"],
    "Potato": ["potato", "aaloo", "aalu", "aloo", "batata", "आलू", "बटाटा"],
    "Wheat": ["wheat", "gehun", "gehu", "गेहूं", "गेहू", "गहू"],
    "Rice / Paddy": ["rice", "paddy", "dhan", "chawal", "धान", "चावल", "भात"],
    "Cotton": ["cotton", "kapas", "ru", "कपास", "कापूस"],
    "Chilli": ["chilli", "chili", "mirch", "mirchi", "मिर्च", "मिरची"],
    "Onion": ["onion", "pyaz", "pyaaz", "kanda", "कांदा", "प्याज"],
    "Soybean": ["soybean", "soya", "सोयाबीन"],
    "Mustard": ["mustard", "sarson", "rai", "राई", "सरसों", "मोहरी"],
    "Maize": ["maize", "corn", "makka", "मक्का", "मका"],
    "Sugarcane": ["sugarcane", "ganna", "ईख", "गन्ना", "ऊस"],
    "Brinjal": ["brinjal", "eggplant", "baingan", "बैंगन", "वांगी"],
    "Banana": ["banana", "kela", "केला", "केळी"],
    "Mango": ["mango", "aam", "आम", "आंबा"],
    "Ginger": ["ginger", "adrak", "अदरक", "आले"],
    "Garlic": ["garlic", "lahsun", "लहसुन", "लसूण"],
    "Okra": ["okra", "bhindi", "ladyfinger", "भिंडी", "भेंडी"],
    "Chickpea": ["chickpea", "gram", "chana", "चना", "हरभरा"],
}


def detect_crop_from_text(text: str) -> Optional[str]:
    """Detects crop name from query text using multi-tier alias matching."""
    if not text:
        return None
    lower_text = text.lower()
    for crop_name, aliases in CROP_ALIASES.items():
        for alias in aliases:
            # Word boundary or substring match for Devanagari & Latin
            if re.search(r"\b" + re.escape(alias.lower()) + r"\b", lower_text) or alias.lower() in lower_text:
                return crop_name
    return None


async def resolve_crop_memory(
    user_id: Optional[str],
    crop_id: Optional[str],
    detected_crop: Optional[str],
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Retrieves user active crop context, past diagnoses memory, and active issues from Supabase.
    Returns: (crop_name, memory_summary, active_issue)
    """
    if not user_id:
        return detected_crop, None, None

    try:
        # 1. Fetch user's registered farm crops
        query = (
            supabase.table("farm_crops")
            .select("id, crop_id, custom_name, planted_date, crops(name, hindi_name)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
        )
        res = query.execute()
        user_crops = res.data or []

        matched_crop = None

        # Filter by explicitly passed crop_id
        if crop_id:
            for c in user_crops:
                if str(c.get("id")) == str(crop_id) or str(c.get("crop_id")) == str(crop_id):
                    matched_crop = c
                    break

        # Or match by detected crop alias
        if not matched_crop and detected_crop:
            d_lower = detected_crop.lower()
            for c in user_crops:
                c_name = (c.get("custom_name") or "").lower()
                cat_info = c.get("crops") or {}
                cat_name = (cat_info.get("name") or "").lower()
                cat_hindi = (cat_info.get("hindi_name") or "").lower()
                if d_lower in c_name or d_lower in cat_name or d_lower in cat_hindi:
                    matched_crop = c
                    break

        # Fallback to farmer's most recently active crop
        if not matched_crop and user_crops:
            matched_crop = user_crops[0]

        if not matched_crop:
            return detected_crop, None, None

        farm_crop_id = matched_crop["id"]
        cat_info = matched_crop.get("crops") or {}
        crop_name = matched_crop.get("custom_name") or cat_info.get("name") or detected_crop or "Crop"

        # 2. Retrieve recent active issues / diagnoses for this farm crop
        diag_res = (
            supabase.table("diagnoses")
            .select("disease_name, severity, created_at, resolved_at")
            .eq("farm_crop_id", farm_crop_id)
            .is_("resolved_at", "null")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        active_issue = None
        mem_parts = [f"Crop: {crop_name}"]

        if matched_crop.get("planted_date"):
            mem_parts.append(f"Planted: {matched_crop['planted_date']}")

        if diag_res.data:
            latest_diag = diag_res.data[0]
            active_issue = latest_diag.get("disease_name")
            severity = latest_diag.get("severity") or "Moderate"
            mem_parts.append(f"Active Diagnosis: {active_issue} ({severity} severity, unresolved)")

        # 3. Retrieve pending tasks
        task_res = (
            supabase.table("farm_crop_tasks")
            .select("title")
            .eq("farm_crop_id", farm_crop_id)
            .eq("status", "pending")
            .limit(2)
            .execute()
        )
        if task_res.data:
            tasks = [t["title"] for t in task_res.data if t.get("title")]
            if tasks:
                mem_parts.append(f"Pending Field Tasks: {', '.join(tasks)}")

        memory_summary = "; ".join(mem_parts)
        return crop_name, memory_summary, active_issue

    except Exception as e:
        logger.warning(f"Error resolving crop memory from Supabase: {e}")
        return detected_crop, None, None


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = None  # "hi", "en", or None for auto-detection


@router.post("/transcribe")
async def transcribe_audio_endpoint(
    audio_file: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
):
    """
    Receives audio recorded on mobile frontend and transcribes it,
    auto-detecting the spoken language (Hindi 'hi' or English 'en').
    """
    file_obj = audio or audio_file
    if not file_obj:
        raise HTTPException(status_code=400, detail="No audio file received.")

    try:
        audio_bytes = await file_obj.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file received.")

        text, detected_lang = await default_stt.transcribe_async(audio_bytes)

        return {
            "success": True,
            "text": text,
            "transcript": text,
            "language": detected_lang,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech recognition error: {str(e)}"
        )


@router.post("/tts")
async def generate_speech_endpoint(request: TTSRequest):
    """
    Converts text to an in-memory MP3 audio stream for direct playback on mobile devices.
    Uses non-blocking async TTS synthesis.
    """
    try:
        audio_bytes = await async_text_to_speech(
            text=request.text,
            language=request.language,
            output_file=None,
        )

        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=plant-response.mp3"
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Text-to-speech error: {str(e)}"
        )


@router.post("/query")
async def plant_voice_query_endpoint(
    audio: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),
    language: str = Form("hi"),
    crop_id: Optional[str] = Form(None),
    query_text: Optional[str] = Form(None),
    return_audio: bool = Form(False),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Unified End-to-End Voice & Agronomy Memory Pipeline:
    1. Receives low-bitrate compressed audio (.m4a/AAC/WAV/MP3) or transcribed text query.
    2. Transcribes speech and detects language if audio is provided.
    3. Performs multi-tier crop alias matching and resolves farmer active crop memory from Supabase.
    4. Generates expert plant diagnosis using Gemini with ICAR agricultural knowledge-base fallback.
    5. Synthesizes voice response to audio, base64 encodes it, and returns clean JSON.
    """
    file_obj = audio or audio_file
    transcribed_text = ""
    lang = language or "hi"

    try:
        # Step 1: Speech-to-Text or direct query text fallback
        if file_obj is not None:
            audio_bytes = await file_obj.read()
            if audio_bytes:
                stt_text, detected_lang = await default_stt.transcribe_async(
                    audio_bytes,
                    language=language if language in ("hi", "en") else None,
                )
                transcribed_text = stt_text
                if not language or language == "auto":
                    lang = "hi" if detected_lang.startswith("hi") else "en"
                else:
                    lang = "hi" if language.startswith("hi") else "en"

        if not transcribed_text and query_text:
            transcribed_text = query_text.strip()
            if not language or language == "auto":
                lang = detect_language(transcribed_text)
            else:
                lang = "hi" if language.startswith("hi") else "en"

        if not transcribed_text:
            raise HTTPException(
                status_code=400,
                detail="No clear speech detected in audio and no query text provided.",
            )

        # Step 2: Multi-tier crop alias matching & Supabase memory retrieval
        detected_crop = detect_crop_from_text(transcribed_text)
        user_id = current_user.get("sub") if current_user else None

        resolved_crop, memory_summary, active_issue = await resolve_crop_memory(
            user_id=user_id,
            crop_id=crop_id,
            detected_crop=detected_crop,
        )

        # Step 3: Agronomy Diagnosis generation
        reply_text = get_plant_diagnosis(
            query=transcribed_text,
            language=lang,
            crop_name=resolved_crop,
            memory_summary=memory_summary,
            active_issue=active_issue,
        )

        # Step 4: Text-to-Speech audio synthesis
        tts_bytes = None
        audio_base64 = None
        try:
            tts_result = await async_text_to_speech(
                text=reply_text,
                language=lang,
                output_file=None,
            )
            if isinstance(tts_result, (bytes, bytearray)):
                tts_bytes = bytes(tts_result)
                audio_base64 = base64.b64encode(tts_bytes).decode("utf-8")
        except Exception as tts_err:
            logger.warning(f"Voice synthesis non-fatal error: {tts_err}")

        # Step 5: Streaming vs JSON response
        if return_audio and tts_bytes:
            encoded_query = urllib.parse.quote(transcribed_text)
            encoded_response = urllib.parse.quote(reply_text)
            return StreamingResponse(
                io.BytesIO(tts_bytes),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=plant-response.mp3",
                    "X-Transcribed-Text": encoded_query,
                    "X-Plant-Response": encoded_response,
                    "X-Detected-Language": lang,
                    "X-Detected-Crop": urllib.parse.quote(resolved_crop or ""),
                },
            )

        return {
            "success": True,
            "transcript": transcribed_text,
            "transcription": transcribed_text,
            "reply_text": reply_text,
            "plant_response": reply_text,
            "audio_base64": audio_base64,
            "detected_crop": resolved_crop,
            "language": lang,
            "active_issue": active_issue,
            "has_memory": bool(memory_summary),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Voice query processing failed")
        raise HTTPException(
            status_code=500,
            detail=f"Voice query processing failed: {str(e)}",
        )