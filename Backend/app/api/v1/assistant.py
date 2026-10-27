import logging
import uuid
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_optional_user
from app.services.storage_service import storage_service
from app.services.crop_service import crop_service
from app.voice_module.stt import default_stt
from app.voice_module.tts import async_text_to_speech, detect_language
from app.voice_module.plant_advisor import get_structured_plant_advisory
from app.api.v1.voice import detect_crop_from_text, resolve_crop_memory

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/assistant",
    tags=["Unified Assistant"],
)

CONFIDENCE_THRESHOLD = 0.70


class AssistantMessageRequest(BaseModel):
    conversation_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    input_mode: Literal["voice", "text"] = "text"
    audio_media_id: Optional[str] = None
    image_media_ids: Optional[List[str]] = None
    text: Optional[str] = None
    language: Optional[str] = "hi"
    crop_id: Optional[str] = None


class AssistantMessageResponse(BaseModel):
    reply_text: str
    audio_url: Optional[str] = None
    transcript: Optional[str] = None
    intent: Optional[str] = "diagnosis"
    confidence: Optional[float] = 0.85
    is_followup: bool = False
    follow_up_question: Optional[str] = None
    detected_crop: Optional[str] = None
    crop_type_id: Optional[str] = None
    conversation_id: Optional[str] = None
    source: Optional[str] = "gemini_ai"


@router.post("/message", response_model=AssistantMessageResponse)
async def process_assistant_message(
    payload: AssistantMessageRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Unified Multimodal Assistant Message Endpoint:
    Funnel for all six client entry points (voice-only, voice+image, image+text, video+text, plain text).
    Traced with Langfuse: session_id grouping, nested spans for STT, Memory, Gemini Advisory, and TTS.
    """
    from langfuse import get_client, propagate_attributes
    langfuse_client = get_client()

    user_id = current_user.get("sub") if current_user else None
    farmer_user_id = user_id or "anonymous_farmer"
    session_id = payload.conversation_id or str(uuid.uuid4())
    transcript = None
    combined_parts = []
    lang = payload.language or "hi"

    with langfuse_client.start_as_current_observation(
        as_type="span",
        name="assistant-message-turn",
        input={
            "text": payload.text,
            "has_audio": bool(payload.audio_media_id),
            "image_media_count": len(payload.image_media_ids or []),
            "input_mode": payload.input_mode,
            "language": lang,
            "crop_id": payload.crop_id,
        },
    ) as root_span:
        with propagate_attributes(
            session_id=session_id,
            user_id=farmer_user_id,
            tags=[payload.input_mode, lang],
            metadata={"conversation_id": session_id},
        ):
            # ─────────────────────────────────────────────────────────────
            # STEP 1: Process Audio & Transcribe (if audio_media_id present)
            # ─────────────────────────────────────────────────────────────
            if payload.audio_media_id:
                audio_bytes = storage_service.get_media_bytes(payload.audio_media_id)
                if not audio_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Audio media '{payload.audio_media_id}' not found in storage.",
                    )

                with langfuse_client.start_as_current_observation(
                    as_type="span",
                    name="whisper-speech-to-text",
                    input={"audio_media_id": payload.audio_media_id, "size_bytes": len(audio_bytes)},
                ) as stt_span:
                    try:
                        transcription, detected_lang = await default_stt.transcribe_async(
                            audio_bytes,
                            language=payload.language if payload.language in ("hi", "en") else None,
                        )
                        if transcription and transcription.strip():
                            transcript = transcription.strip()
                            combined_parts.append(transcript)
                            if not payload.language or payload.language == "auto":
                                lang = "hi" if detected_lang.startswith("hi") else "en"
                        stt_span.update(output={"transcript": transcript, "detected_language": detected_lang})
                    except Exception as stt_err:
                        logger.error(f"STT transcription failed: {stt_err}")
                        stt_span.update(status_message=str(stt_err), level="ERROR")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Speech recognition error: {str(stt_err)}",
                        )

            # Append typed text if present
            if payload.text and payload.text.strip():
                combined_parts.append(payload.text.strip())

            combined_text = " ".join(combined_parts).strip()

            # If both voice and text were empty and no images were provided, reject request
            if not combined_text and not payload.image_media_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Message requires audio, text, or image media input.",
                )

            # Auto-detect language from text if not explicitly Hindi
            if combined_text and (not lang or lang == "auto"):
                lang = detect_language(combined_text)

            # ─────────────────────────────────────────────────────────────
            # STEP 2: Crop-Alias Resolution BEFORE calling LLM
            # ─────────────────────────────────────────────────────────────
            with langfuse_client.start_as_current_observation(
                as_type="span",
                name="resolve-crop-memory",
                input={"combined_text": combined_text, "crop_id_hint": payload.crop_id},
            ) as mem_span:
                detected_crop = detect_crop_from_text(combined_text) if combined_text else None
                crop_type_id = None

                if detected_crop:
                    try:
                        catalog_item = crop_service.find_catalog_crop_by_name(detected_crop)
                        if catalog_item:
                            crop_type_id = str(catalog_item.id)
                    except Exception as e:
                        logger.debug(f"Catalog lookup for '{detected_crop}' notice: {e}")

                # Retrieve farmer crop memory and unresolved diagnoses from Supabase
                resolved_crop, memory_summary, active_issue = await resolve_crop_memory(
                    user_id=user_id,
                    crop_id=payload.crop_id or crop_type_id,
                    detected_crop=detected_crop,
                )
                final_crop_name = resolved_crop or detected_crop
                mem_span.update(
                    output={
                        "detected_crop": detected_crop,
                        "resolved_crop": final_crop_name,
                        "crop_type_id": crop_type_id,
                        "has_memory": bool(memory_summary),
                        "active_issue": active_issue,
                    }
                )

            # ─────────────────────────────────────────────────────────────
            # STEP 3 & 4: Multimodal Plant Advisory with Confidence Gate
            # ─────────────────────────────────────────────────────────────
            images_bytes: List[bytes] = []
            if payload.image_media_ids:
                for mid in payload.image_media_ids:
                    if mid:
                        ibytes = storage_service.get_media_bytes(mid)
                        if ibytes:
                            images_bytes.append(ibytes)

            advisory_result = await get_structured_plant_advisory(
                query=combined_text,
                language=lang,
                crop_name=final_crop_name,
                crop_type_id=crop_type_id,
                memory_summary=memory_summary,
                active_issue=active_issue,
                farm_crop_history=memory_summary,
                prior_diagnoses=active_issue,
                images_bytes=images_bytes if images_bytes else None,
                confidence_threshold=CONFIDENCE_THRESHOLD,
            )

            reply_text = advisory_result.reply_text

            # ─────────────────────────────────────────────────────────────
            # STEP 5: Input Mode Routing (Voice vs Text)
            # ─────────────────────────────────────────────────────────────
            audio_url = None
            if payload.input_mode == "voice":
                with langfuse_client.start_as_current_observation(
                    as_type="span",
                    name="speech-synthesis-tts",
                    input={"text": reply_text, "language": lang},
                ) as tts_span:
                    try:
                        tts_result = await async_text_to_speech(
                            text=reply_text,
                            language=lang,
                            output_file=None,
                        )
                        if isinstance(tts_result, (bytes, bytearray)):
                            tts_bytes = bytes(tts_result)
                            tts_media_id = storage_service.upload_media(
                                user_id=user_id,
                                media_bytes=tts_bytes,
                                content_type="audio/mpeg",
                                category="assistant_tts",
                            )
                            if tts_media_id:
                                audio_url = storage_service.get_signed_media_url(tts_media_id)
                        tts_span.update(output={"audio_url": audio_url, "size_bytes": len(tts_bytes) if audio_url else 0})
                    except Exception as tts_err:
                        logger.error(f"TTS synthesis non-fatal error: {tts_err}")
                        tts_span.update(status_message=str(tts_err), level="WARNING")
                        audio_url = None

            root_span.update(
                output={
                    "reply_text": reply_text,
                    "confidence": advisory_result.confidence,
                    "intent": advisory_result.intent,
                    "is_followup": advisory_result.is_followup,
                    "follow_up_question": advisory_result.follow_up_question,
                    "audio_url": audio_url,
                },
                metadata={
                    "detected_crop": final_crop_name,
                    "crop_type_id": crop_type_id,
                },
            )

    return AssistantMessageResponse(
        reply_text=reply_text,
        audio_url=audio_url,
        transcript=transcript,
        intent=advisory_result.intent,
        confidence=advisory_result.confidence,
        is_followup=advisory_result.is_followup,
        follow_up_question=advisory_result.follow_up_question,
        detected_crop=final_crop_name,
        crop_type_id=crop_type_id,
        conversation_id=payload.conversation_id,
        source=advisory_result.source,
    )
