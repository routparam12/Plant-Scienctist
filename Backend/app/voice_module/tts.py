#backend\app\voice_module\tts.py

import asyncio
import io
import os
import re
from pathlib import Path
from typing import Optional, Union

try:
    from gtts import gTTS
except ImportError:
    gTTS = None

try:
    import edge_tts
except ImportError:
    edge_tts = None


def detect_language(text: str) -> str:
    """
    Auto-detects whether text is Hindi ('hi') or English ('en').
    Checks for Devanagari Unicode range (\u0900-\u097F).
    """
    if not text:
        return "en"
    devanagari_chars = re.findall(r"[\u0900-\u097F]", text)
    if len(devanagari_chars) >= 2 or (len(devanagari_chars) / len(text)) > 0.05:
        return "hi"
    return "en"


async def async_text_to_speech(
    text: str,
    language: Optional[str] = None,
    output_file: Optional[Union[str, Path]] = None,
) -> Union[str, bytes]:
    """
    Async-safe Text-to-Speech synthesis.
    Works natively within FastAPI async event loops without blocking or throwing
    'RuntimeError: This event loop is already running'.
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty.")

    target_lang = language or detect_language(text)

    # 1. Edge-TTS (High quality neural voice, native async)
    if edge_tts is not None:
        try:
            voice = "hi-IN-MadhurNeural" if target_lang.startswith("hi") else "en-IN-NeerjaNeural"
            communicate = edge_tts.Communicate(text=text, voice=voice)
            if output_file:
                await communicate.save(str(output_file))
                return str(output_file)
            else:
                buf = bytearray()
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        buf.extend(chunk["data"])
                if buf:
                    return bytes(buf)
        except Exception as e:
            print(f"Edge-TTS synthesis error: {e}. Falling back to gTTS.")

    # 2. Fallback to gTTS via non-blocking thread execution
    if gTTS is not None:
        def _sync_gtts():
            lang_code = "hi" if target_lang.startswith("hi") else "en"
            tts = gTTS(text=text, lang=lang_code, slow=False)
            if output_file:
                tts.save(str(output_file))
                return str(output_file)
            else:
                fp = io.BytesIO()
                tts.write_to_fp(fp)
                fp.seek(0)
                return fp.read()

        return await asyncio.to_thread(_sync_gtts)

    raise RuntimeError("No TTS engine installed. Please run: pip install edge-tts gTTS")


def text_to_speech(
    text: str,
    language: Optional[str] = None,
    output_file: Optional[Union[str, Path]] = None,
) -> Union[str, bytes]:
    """
    Synchronous fallback wrapper.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # Inside running loop, schedule async
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, async_text_to_speech(text, language, output_file)).result()
    else:
        return asyncio.run(async_text_to_speech(text, language, output_file))