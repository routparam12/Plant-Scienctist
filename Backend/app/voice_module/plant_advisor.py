# backend/app/voice_module/plant_advisor.py

import os
import re
from typing import Optional, List, Dict, Any, Union
from app.core.config import settings

# ICAR-aligned agricultural diagnosis knowledge base for offline fallback
PLANT_KNOWLEDGE_BASE = [
    {
        "keywords": ["पीली", "पीला", "yellow", "yellowing", "chlorosis", "लीफ कर्ल", "curl"],
        "crops": ["tomato", "टमाटर"],
        "hi": "टमाटर की पत्तियों में पीलापन और मुड़ना लीफ कर्ल वायरस या नाइट्रोजन की कमी का संकेत है। उपचार के लिए 5 मिली नीम का तेल 1 लीटर पानी में मिलाकर स्प्रे करें या इमिडाक्लोप्रिड 0.3 मिली प्रति लीटर का छिड़काव करें।",
        "en": "Yellowing or curling in tomato leaves indicates Tomato Leaf Curl Virus or Nitrogen deficiency. Spray 5% Neem Seed Kernel Extract (NSKE) @ 5ml/L or Imidacloprid @ 0.3ml/L.",
    },
    {
        "keywords": ["पीली", "पीला", "yellow", "yellowing", "chlorosis"],
        "crops": [],
        "hi": "पौधे की पत्तियां पीली होना आमतौर पर नाइट्रोजन की कमी या अधिक पानी देने का संकेत है। कृपया मिट्टी की नमी जांचें और नाइट्रोजन युक्त जैविक खाद या वर्मीकम्पोस्ट डालें।",
        "en": "Yellowing leaves typically indicate nitrogen deficiency or overwatering. Check soil moisture and apply balanced organic compost or nitrogen fertilizer.",
    },
    {
        "keywords": ["धब्बे", "काले धब्बे", "भूरे", "spot", "spots", "fungus", "फफूंद", "फंगस", "blight", "झुलसा"],
        "crops": [],
        "hi": "पत्तियों पर भूरे या काले धब्बे फंगल संक्रमण (अल्टरनेरिया लीफ स्पॉट या ब्लाइट) हो सकते हैं। प्रभावित पत्तियों को हटाएं और मैंकोज़ेब 2.5 ग्राम या कॉपर ऑक्सीक्लोराइड 3 ग्राम प्रति लीटर पानी में मिलाकर स्प्रे करें।",
        "en": "Brown or dark spots on leaves indicate fungal leaf spot or early blight. Remove diseased foliage and spray Mancozeb @ 2.5g/L or Copper Oxychloride @ 3g/L.",
    },
    {
        "keywords": ["कीड़े", "कीड़ा", "pest", "pests", "aphid", "aphids", "माहू", "सफेद मक्खी", "whitefly", "इल्ली", "borer", "larva"],
        "crops": [],
        "hi": "कीटों और रस चूसक कीड़ों के नियंत्रण के लिए 5 मिली नीम का तेल 1 लीटर पानी में 2 बूंद साबुन के साथ मिलाकर पत्तियों के दोनों तरफ स्प्रे करें। गंभीर प्रकोप में प्रोफेनोफॉस 2 मिली प्रति लीटर का उपयोग करें।",
        "en": "For sucking pests and worms, mix 5ml neem oil per liter of water with a drop of liquid soap and spray both leaf sides. For severe infestation, apply Profenofos @ 2ml/L.",
    },
    {
        "keywords": ["मुरझा", "सूख", "wilt", "wilting", "dry", "उकठा"],
        "crops": [],
        "hi": "पौधा मुरझाना अत्यधिक धूप, जड़ों में फंगस (रूट रॉट) या पानी की कमी से होता है। ट्राइकोडर्मा विरिडी 5 ग्राम प्रति लीटर से ड्रेंचिंग करें और जल निकासी में सुधार करें।",
        "en": "Plant wilting is caused by underwatering, heat stress, or root rot fungus. Drench roots with Trichoderma viride @ 5g/L and ensure proper bed drainage.",
    },
    {
        "keywords": ["फूल", "फल", "flower", "fruit", "फूल गिर", "drop", "dropping"],
        "crops": [],
        "hi": "फूल या छोटे फल गिरना बोरॉन की कमी या नमी के उतार-चढ़ाव से होता है। फूल आते समय बोरॉन 20% का 1 ग्राम प्रति लीटर पानी में मिलाकर फोलियर स्प्रे करें।",
        "en": "Flower or fruit drop occurs due to boron deficiency or uneven moisture. Apply a foliar spray of 20% Soluble Boron @ 1g/L during the flowering stage.",
    },
]

DEFAULT_FALLBACK = {
    "hi": "आपके पौधे की जानकारी नोट कर ली गई है। कृपया मिट्टी की नमी, धूप और पत्तों के नीचे कीड़ों की जांच करें। बेहतर सलाह के लिए फसल का नाम और लक्षण बताएं।",
    "en": "Your plant inquiry has been noted. Please inspect soil moisture, sunlight, and check under leaves for pests. Mention specific symptoms for tailored guidance.",
}

_gemini_client = None

def _get_gemini():
    global _gemini_client
    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    if _gemini_client is None:
        try:
            from google import genai
            _gemini_client = genai.Client(api_key=api_key)
        except Exception as e:
            print(f"Warning: Failed to initialize Google GenAI client in plant_advisor: {e}")
            _gemini_client = None
    return _gemini_client


def get_plant_diagnosis(
    query: str,
    language: str = "hi",
    crop_name: Optional[str] = None,
    memory_summary: Optional[str] = None,
    active_issue: Optional[str] = None,
) -> str:
    """
    Generates a plant diagnostic response based on:
    - User's spoken query
    - Active crop context and past memory summary
    - Spoken language ('hi' for Hindi, 'en' for English)
    Uses Gemini when configured; otherwise falls back to ICAR expert knowledge base.
    """
    if not query or not query.strip():
        return DEFAULT_FALLBACK.get(language, DEFAULT_FALLBACK["en"])

    target_lang = "hi" if language.startswith("hi") else "en"
    ai = _get_gemini()

    if ai:
        try:
            crop_ctx = f"Active Crop: {crop_name}" if crop_name else "Crop: Indian agricultural plant"
            mem_ctx = f"Field & Crop Memory: {memory_summary}" if memory_summary else ""
            issue_ctx = f"Active Detected Disease / Issue: {active_issue}" if active_issue else ""

            lang_instr = (
                "Respond in natural, spoken, conversational Hindi (Devanagari script)."
                if target_lang == "hi"
                else "Respond in natural, concise, spoken Indian English."
            )

            prompt = f"""You are a friendly senior agricultural scientist and AI plant doctor speaking directly to an Indian farmer via audio voice note.
{crop_ctx}
{mem_ctx}
{issue_ctx}
Farmer's spoken question: "{query}"

Instructions:
1. Provide a direct, compassionate, expert diagnosis in 2 to 3 concise spoken sentences (under 60 words total).
2. Give clear, actionable advice with exact organic remedies (e.g. Neem oil, Trichoderma) or chemical molecule dosage per liter of water.
3. Keep it purely text suitable for text-to-speech reading. Do not use markdown headers, asterisks, bullet points, or emojis.
4. Language: {lang_instr}"""

            response = ai.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt,
            )
            if response.text and response.text.strip():
                clean_text = response.text.strip().replace("*", "").replace("#", "").strip()
                return clean_text
        except Exception as e:
            print(f"Gemini voice diagnosis fallback: {e}")

    # Fallback: Knowledge-base keyword & crop matching
    lower_query = query.lower()
    crop_lower = (crop_name or "").lower()

    # 1. Match both keywords and crop
    for item in PLANT_KNOWLEDGE_BASE:
        has_kw = any(kw.lower() in lower_query for kw in item["keywords"])
        has_crop = not item["crops"] or any(c in crop_lower or c in lower_query for c in item["crops"])
        if has_kw and has_crop:
            return item.get(target_lang, item["en"])

    # 2. Match keywords only
    for item in PLANT_KNOWLEDGE_BASE:
        if any(kw.lower() in lower_query for kw in item["keywords"]):
            return item.get(target_lang, item["en"])

    # 3. Default fallback
    if crop_name:
        if target_lang == "hi":
            return f"आपकी {crop_name} फसल का सवाल दर्ज कर लिया गया है। कृपया मिट्टी की नमी और पत्तियों की स्थिति जांचें, या लक्षण का फोटो ऐप में स्कैन करें।"
        return f"Your query regarding {crop_name} has been noted. Please inspect leaf underside and soil moisture, or take a photo scan in the app for an instant report."

    return DEFAULT_FALLBACK.get(target_lang, DEFAULT_FALLBACK["en"])


from pydantic import BaseModel, Field


class StructuredAdvisoryResult(BaseModel):
    intent: str = Field(default="diagnosis", description="diagnosis, general_advice, clarification, or greeting")
    reply_text: str = Field(description="Spoken, concise response text for farmer")
    confidence: float = Field(default=0.85, description="Confidence score from 0.0 to 1.0")
    is_followup: bool = Field(default=False, description="True if confidence < 0.70 and follow-up question is asked")
    follow_up_question: Optional[str] = Field(default=None, description="Targeted follow-up question if clarification needed")
    crop_name: Optional[str] = None
    crop_type_id: Optional[str] = None
    source: str = Field(default="gemini_ai", description="'gemini_ai' or 'offline_reference'")


async def get_structured_plant_advisory(
    query: str,
    language: str = "hi",
    crop_name: Optional[str] = None,
    crop_type_id: Optional[str] = None,
    memory_summary: Optional[str] = None,
    active_issue: Optional[str] = None,
    farm_crop_history: Optional[str] = None,
    prior_diagnoses: Optional[str] = None,
    images_bytes: Optional[List[bytes]] = None,
    confidence_threshold: float = 0.70,
) -> StructuredAdvisoryResult:
    """
    Structured Agronomy Advisory & Diagnosis Engine:
    - Handles multimodal inputs (voice/text query + image frames).
    - Incorporates active crop context, farm history, and memory.
    - Generates structured intent, reply_text, and confidence score.
    - If confidence < confidence_threshold (0.70), enforces follow-up clarification question.
    """
    target_lang = "hi" if (language or "hi").startswith("hi") else "en"
    clean_query = (query or "").strip()
    ai = _get_gemini()

    # 1. Gemini Multimodal Analysis
    if ai:
        try:
            import json
            from google.genai import types

            contents = []
            if images_bytes:
                for img in images_bytes:
                    if img and len(img) > 0:
                        contents.append(
                            types.Part.from_bytes(
                                data=img,
                                mime_type="image/jpeg",
                            )
                        )

            crop_ctx = f"Active Crop: {crop_name} (ID: {crop_type_id or 'none'})" if crop_name else "Crop: Indian agricultural plant"
            mem_ctx = f"Field & Crop Memory: {memory_summary}" if memory_summary else ""
            diag_ctx = f"Prior Diagnoses / Active Issues: {prior_diagnoses or active_issue or 'None'}"
            hist_ctx = f"Farm Crop History: {farm_crop_history}" if farm_crop_history else ""

            lang_instr = (
                "Respond in natural, spoken, conversational Hindi (Devanagari script)."
                if target_lang == "hi"
                else "Respond in natural, concise, spoken Indian English."
            )

            prompt = f"""You are a senior agricultural scientist and AI plant doctor speaking directly to an Indian farmer via audio/text note.
{crop_ctx}
{mem_ctx}
{diag_ctx}
{hist_ctx}
Farmer's query: "{clean_query or 'Please analyze the attached plant specimen image.'}"

Analyze the question and any attached specimen leaf images carefully.
Provide a structured JSON response matching this schema:
{{
  "intent": "diagnosis | general_advice | clarification | greeting",
  "confidence": 0.85,
  "reply_text": "Spoken diagnostic explanation and exact organic/chemical remedy in 2-3 concise sentences (under 60 words). No markdown headers, asterisks, bullet points, or emojis.",
  "is_followup": false,
  "follow_up_question": null
}}

Critical Guidelines:
1. Intent: Use 'diagnosis' if symptoms, pests, or disease are discussed or shown. Use 'general_advice' for agronomy, planting, or weather. Use 'greeting' for hello/namaste.
2. Confidence score: Estimate from 0.0 to 1.0 based on symptom clarity and image quality.
3. If confidence is below {confidence_threshold} for a diagnosis turn (symptoms ambiguous, multiple diseases possible, blurry photo, or missing crop name):
   - Set "is_followup": true
   - Set "confidence": [score below {confidence_threshold}]
   - Set "follow_up_question": "A polite, direct question asking the farmer to clarify the symptom, check leaf underside, or retake the photo."
   - Set "reply_text": the exact same follow-up question so it can be spoken directly to the farmer.
4. Language requirement: {lang_instr}"""

            contents.append(prompt)

            from langfuse import get_client
            langfuse_client = get_client()

            with langfuse_client.start_as_current_observation(
                as_type="generation",
                name="gemini-plant-advisory",
                model="gemini-3.5-flash",
                input=prompt,
                metadata={
                    "crop": crop_name,
                    "crop_type_id": crop_type_id,
                    "has_images": bool(images_bytes),
                    "confidence_threshold": confidence_threshold,
                },
            ) as gen_span:
                response = ai.models.generate_content(
                    model="gemini-3.5-flash",
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )

                usage = None
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    usage = {
                        "input": getattr(response.usage_metadata, "prompt_token_count", None),
                        "output": getattr(response.usage_metadata, "candidates_token_count", None),
                        "total": getattr(response.usage_metadata, "total_token_count", None),
                    }

                gen_span.update(
                    output=response.text,
                    usage_details=usage,
                )

            if response.text and response.text.strip():
                data = json.loads(response.text.strip())
                conf = float(data.get("confidence", 0.85))
                is_fol = bool(data.get("is_followup", False)) or (data.get("intent") == "diagnosis" and conf < confidence_threshold)
                follow_up_q = data.get("follow_up_question")

                rep_text = data.get("reply_text") or ""
                if is_fol and follow_up_q:
                    rep_text = follow_up_q

                clean_reply = rep_text.replace("*", "").replace("#", "").strip()

                return StructuredAdvisoryResult(
                    intent=data.get("intent", "diagnosis"),
                    reply_text=clean_reply,
                    confidence=conf,
                    is_followup=is_fol,
                    follow_up_question=follow_up_q,
                    crop_name=crop_name,
                    crop_type_id=crop_type_id,
                    source="gemini_ai",
                )
        except Exception as e:
            print(f"Gemini structured diagnosis warning: {e}. Falling back to knowledge base.")

    # 2. Knowledge-Base Resilient Fallback
    lower_query = clean_query.lower()
    crop_lower = (crop_name or "").lower()

    # Keyword + crop match
    for item in PLANT_KNOWLEDGE_BASE:
        has_kw = any(kw.lower() in lower_query for kw in item["keywords"])
        has_crop = not item["crops"] or any(c in crop_lower or c in lower_query for c in item["crops"])
        if has_kw and has_crop:
            return StructuredAdvisoryResult(
                intent="diagnosis",
                reply_text=item.get(target_lang, item["en"]),
                confidence=0.88,
                is_followup=False,
                crop_name=crop_name,
                crop_type_id=crop_type_id,
                source="offline_reference",
            )

    # Keyword only match
    for item in PLANT_KNOWLEDGE_BASE:
        if any(kw.lower() in lower_query for kw in item["keywords"]):
            return StructuredAdvisoryResult(
                intent="diagnosis",
                reply_text=item.get(target_lang, item["en"]),
                confidence=0.75,
                is_followup=False,
                crop_name=crop_name,
                crop_type_id=crop_type_id,
                source="offline_reference",
            )

    # Low-confidence fallback triggers follow-up question
    if crop_name:
        follow_up = (
            f"आपकी {crop_name} में कौन से लक्षण दिख रहे हैं? क्या पत्तियां पीली हो रही हैं या धब्बे हैं? कृपया स्पष्ट करें या पत्ती की स्पष्ट फोटो लें।"
            if target_lang == "hi"
            else f"What specific symptoms are visible on your {crop_name}? Are leaves yellowing or spotting? Please clarify or share a clear photo of the leaf."
        )
        return StructuredAdvisoryResult(
            intent="diagnosis",
            reply_text=follow_up,
            confidence=0.55,
            is_followup=True,
            follow_up_question=follow_up,
            crop_name=crop_name,
            crop_type_id=crop_type_id,
            source="offline_reference",
        )

    # General greeting or unclear query
    if any(g in lower_query for g in ["namaste", "नमस्ते", "hello", "hi", "राम राम", "pranam"]):
        greeting = (
            "नमस्ते किसान भाई! मैं आपका प्लांट साइंटिस्ट सहायक हूँ। अपनी फसल का नाम और जो समस्या आ रही है वह बताएं।"
            if target_lang == "hi"
            else "Hello farmer friend! I am your Plant Scientist assistant. Please tell me your crop name and the issue you are observing."
        )
        return StructuredAdvisoryResult(
            intent="greeting",
            reply_text=greeting,
            confidence=0.95,
            is_followup=False,
            crop_name=crop_name,
            crop_type_id=crop_type_id,
            source="offline_reference",
        )

    general_followup = (
        "कृपया अपनी फसल का नाम और पौधे में दिखने वाले लक्षण बताएं, या पौधे की पत्ती का फोटो स्कैन करें ताकि सटीक उपचार बताया जा सके।"
        if target_lang == "hi"
        else "Please mention your crop name and observed symptoms, or take a leaf photo scan so an exact treatment can be provided."
    )
    return StructuredAdvisoryResult(
        intent="clarification",
        reply_text=general_followup,
        confidence=0.50,
        is_followup=True,
        follow_up_question=general_followup,
        crop_name=crop_name,
        crop_type_id=crop_type_id,
        source="offline_reference",
    )

