import io
import urllib.parse
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from app.voice_module.stt import default_stt
from app.voice_module.tts import text_to_speech, detect_language
from app.voice_module.plant_advisor import get_plant_diagnosis

router = APIRouter(
    prefix="/voice",
    tags=["Voice"]
)


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = None  # "hi", "en", or None for auto-detection


@router.post("/transcribe")
async def transcribe_audio_endpoint(
    audio_file: UploadFile = File(...)
):
    """
    Receives audio recorded on mobile/web frontend and transcribes it,
    auto-detecting the spoken language (Hindi 'hi' or English 'en').
    """
    try:
        audio_bytes = await audio_file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file received.")

        text, detected_lang = await default_stt.transcribe_async(audio_bytes)

        return {
            "success": True,
            "text": text,
            "language": detected_lang,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech recognition error: {str(e)}"
        )


@router.post("/tts")
async def generate_speech_endpoint(request: TTSRequest):
    """
    Converts text to an in-memory MP3 audio stream for direct playback
    on the mobile/web frontend.
    """
    try:
        audio_bytes = text_to_speech(
            text=request.text,
            language=request.language,
            output_file=None,  # returns bytes directly
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
    audio_file: UploadFile = File(...),
    return_audio: bool = Form(default=False),
):
    """
    Clean End-to-End Voice Architecture:
    1. Receives audio captured on mobile / web frontend.
    2. Transcribes speech and auto-detects language ('hi' or 'en').
    3. Generates the plant diagnosis response.
    4. Returns either:
       - JSON response (transcription + plant diagnosis text) if return_audio=False
       - Live MP3 streaming audio response if return_audio=True
    """
    try:
        audio_bytes = await audio_file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file received.")

        # 1. Transcribe & detect spoken language (Hindi or English)
        transcribed_text, detected_lang = await default_stt.transcribe_async(audio_bytes)

        # Normalize language to 'hi' or 'en'
        lang = "hi" if detected_lang.startswith("hi") else "en"

        # 2. Generate plant diagnosis response
        plant_response = get_plant_diagnosis(transcribed_text, language=lang)

        # 3. Return Audio Stream
        if return_audio:
            tts_bytes = text_to_speech(
                text=plant_response,
                language=lang,
                output_file=None,
            )

            # URL-encode headers to safely convey metadata with streaming response
            encoded_query = urllib.parse.quote(transcribed_text)
            encoded_response = urllib.parse.quote(plant_response)

            return StreamingResponse(
                io.BytesIO(tts_bytes),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=plant-response.mp3",
                    "X-Transcribed-Text": encoded_query,
                    "X-Plant-Response": encoded_response,
                    "X-Detected-Language": lang,
                }
            )

        # 4. Return JSON Text Response
        return {
            "success": True,
            "transcription": transcribed_text,
            "language": lang,
            "plant_response": plant_response,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Voice query processing failed: {str(e)}"
        )