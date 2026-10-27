#backend\app\voice_module\stt.py

import asyncio
import io
import os
import tempfile
from pathlib import Path
from typing import BinaryIO, Dict, Optional, Tuple, Union

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except ImportError:
    SR_AVAILABLE = False

try:
    from sarvamai import sarvamai
    SARVAM_AVAILABLE = True
except ImportError:
    SARVAM_AVAILABLE = False


class SpeechToText:
    """
    Speech-to-Text service supporting:
    1. Audio files / bytes (received from mobile/web frontends via FastAPI)
    2. Microphone capture (optional for local desktop testing)
    3. Multi-language detection (auto-detects 'hi' and 'en')
    """

    def __init__(self, model_size: str = "base", device: str = "cpu", compute_type: str = "int8"):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self._whisper_model = None
        self._sr_recognizer = None

    def _get_whisper(self) -> Optional[WhisperModel]:
        if WhisperModel is None:
            return None
        if self._whisper_model is None:
            self._whisper_model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
            )
        return self._whisper_model

    def _get_sr(self):
        if sr is None:
            return None
        if self._sr_recognizer is None:
            self._sr_recognizer = sr.Recognizer()
        return self._sr_recognizer

    def transcribe(
        self,
        audio_source: Optional[Union[str, Path, bytes, BinaryIO]] = None,
        language: Optional[str] = None,
    ) -> str:
        """
        Transcribes audio from a file path, bytes, or microphone.

        :param audio_source: Audio file path, audio bytes, or None to use microphone.
        :param language: 'hi', 'en', or None (auto-detect).
        :return: Transcribed text string.
        """
        text, _ = self.transcribe_with_language(audio_source=audio_source, language=language)
        return text

    def transcribe_with_language(
        self,
        audio_source: Optional[Union[str, Path, bytes, BinaryIO]] = None,
        language: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Transcribes audio and returns a tuple of (transcribed_text, detected_language).
        Auto-detects whether speech is Hindi ('hi') or English ('en').
        """
        whisper = self._get_whisper()

        # If audio_source is None, try microphone capture (for local CLI/desktop testing)
        if audio_source is None:
            recognizer = self._get_sr()
            if recognizer is None or not hasattr(sr, "Microphone"):
                raise RuntimeError("speech_recognition with PyAudio is required for microphone capture.")
            with sr.Microphone() as source:
                print("Listening through microphone...")
                recognizer.adjust_for_ambient_noise(source, duration=1)
                audio_data = recognizer.listen(source, timeout=10, phrase_time_limit=15)
                lang_code = "hi-IN" if language == "hi" else ("en-IN" if language == "en" else "hi-IN")
                try:
                    text = recognizer.recognize_google(audio_data, language=lang_code)
                    detected = "hi" if "hi" in lang_code else "en"
                    return text, detected
                except sr.UnknownValueError:
                    return "", language or "unknown"
                except sr.RequestError as e:
                    raise RuntimeError(f"Speech recognition error: {e}")

        # Frontend audio input: Path, bytes, or file stream
        temp_audio_path = None
        try:
            def _detect_audio_suffix(sample: bytes) -> str:
                if len(sample) >= 12 and b"ftyp" in sample[:12]:
                    return ".m4a"
                if sample.startswith(b"RIFF"):
                    return ".wav"
                if sample.startswith(b"ID3") or sample.startswith(b"\xff\xfb") or sample.startswith(b"\xff\xf3"):
                    return ".mp3"
                if sample.startswith(b"\x1a\x45\xdf\xa3"):
                    return ".webm"
                return ".m4a"

            if isinstance(audio_source, (bytes, bytearray)):
                suffix = _detect_audio_suffix(bytes(audio_source[:32]))
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                temp_file.write(audio_source)
                temp_file.flush()
                temp_file.close()
                audio_path = temp_file.name
                temp_audio_path = temp_file.name
            elif isinstance(audio_source, (io.BytesIO, io.BufferedReader, io.RawIOBase)):
                audio_source.seek(0)
                raw_bytes = audio_source.read()
                suffix = _detect_audio_suffix(raw_bytes[:32]) if raw_bytes else ".m4a"
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                temp_file.write(raw_bytes)
                temp_file.flush()
                temp_file.close()
                audio_path = temp_file.name
                temp_audio_path = temp_file.name
            elif isinstance(audio_source, (str, Path)):
                audio_path = str(audio_source)
                if not os.path.exists(audio_path):
                    raise FileNotFoundError(f"Audio file not found: {audio_path}")
            else:
                raise ValueError(f"Unsupported audio source type: {type(audio_source)}")

            # Primary: Whisper (Handles MP3, WAV, WEBM, M4A with language detection)
            if whisper is not None:
                try:
                    segments, info = whisper.transcribe(
                        audio_path,
                        language=language,
                        vad_filter=True,
                    )
                    text = " ".join(seg.text.strip() for seg in segments).strip()
                    detected_lang = info.language
                    return text, detected_lang
                except Exception as whisper_err:
                    print(f"Whisper decode warning: {whisper_err}")


            # Fallback: speech_recognition using Google API
            recognizer = self._get_sr()
            if recognizer is not None:
                try:
                    with sr.AudioFile(audio_path) as source:
                        audio_data = recognizer.record(source)
                        lang_code = "hi-IN" if language == "hi" else "en-US"
                        try:
                            text = recognizer.recognize_google(audio_data, language=lang_code)
                            return text, language or "hi"
                        except sr.UnknownValueError:
                            return "", language or "unknown"
                except Exception as sr_err:
                    print(f"Fallback SR decode warning: {sr_err}")

            return "", language or "unknown"

        finally:
            if temp_audio_path and os.path.exists(temp_audio_path):
                try:
                    os.remove(temp_audio_path)
                except OSError:
                    pass

    async def transcribe_async(
        self,
        audio_source: Union[str, Path, bytes, BinaryIO],
        language: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Non-blocking async transcription for FastAPI endpoints."""
        return await asyncio.to_thread(self.transcribe_with_language, audio_source, language)


# Global default instance
default_stt = SpeechToText()


def speech_to_text(audio_source: Optional[Union[str, Path, bytes, BinaryIO]] = None, language: Optional[str] = None) -> str:
    """Convenience helper function for speech-to-text."""
    return default_stt.transcribe(audio_source=audio_source, language=language)


def transcribe_with_language(audio_source: Union[str, Path, bytes, BinaryIO]) -> Tuple[str, str]:
    """Transcribes audio and returns (text, detected_language)."""
    return default_stt.transcribe_with_language(audio_source=audio_source)