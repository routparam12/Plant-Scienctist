import io
import sys
from pathlib import Path

# Add Backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app
from app.services.storage_service import storage_service

client = TestClient(app)

# 1-second silent WAV header bytes for testing audio upload and STT
TINY_WAV = (
    b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00"
    b"\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
)

# 1x1 pixel JPEG for testing image upload
TINY_JPEG = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
    b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
    b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
    b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00"
    b"\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01"
    b"\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00"
    b"\xbf\x00\xff\xd9"
)


def test_media_upload_audio_and_image():
    # 1. Upload audio
    audio_file = io.BytesIO(TINY_WAV)
    audio_res = client.post(
        "/v1/media/upload",
        files={"file": ("sample.wav", audio_file, "audio/wav")},
    )
    assert audio_res.status_code == 200, audio_res.text
    audio_data = audio_res.json()
    assert audio_data["success"] is True
    assert "media_id" in audio_data
    assert audio_data["content_type"] == "audio/wav"

    # 2. Upload image
    img_file = io.BytesIO(TINY_JPEG)
    img_res = client.post(
        "/v1/media/upload",
        files={"file": ("leaf.jpg", img_file, "image/jpeg")},
    )
    assert img_res.status_code == 200, img_res.text
    img_data = img_res.json()
    assert img_data["success"] is True
    assert "media_id" in img_data
    assert img_data["content_type"] == "image/jpeg"


def test_entry_point_1_plain_text():
    # Entry Point: Plain Text inquiry
    # Text input_mode -> MUST NOT call TTS, audio_url must be None
    res = client.post(
        "/v1/assistant/message",
        json={
            "conversation_id": "test-conv-1",
            "input_mode": "text",
            "text": "टमाटर के पत्तों पर पीले धब्बे और लीफ कर्ल है",
            "language": "hi",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["reply_text"] is not None
    assert len(data["reply_text"]) > 0
    assert data["audio_url"] is None  # Never wasted TTS call on text mode
    assert data["detected_crop"] == "Tomato"  # Resolved before LLM call
    assert data["intent"] == "diagnosis"
    assert data["confidence"] >= 0.70


def test_entry_point_2_image_plus_text():
    # Entry Point: Photo + Text
    img_file = io.BytesIO(TINY_JPEG)
    upload_res = client.post(
        "/v1/media/upload",
        files={"file": ("blight_leaf.jpg", img_file, "image/jpeg")},
    )
    media_id = upload_res.json()["media_id"]

    res = client.post(
        "/v1/assistant/message",
        json={
            "conversation_id": "test-conv-2",
            "input_mode": "text",
            "image_media_ids": [media_id],
            "text": "Aloo ki fasal me black spots dikh rahe hain",
            "language": "hi",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["reply_text"] is not None
    assert data["detected_crop"] == "Potato"
    assert data["audio_url"] is None


def test_entry_point_3_video_derived_frames_plus_text():
    # Entry Point: Video-Derived Frames + Text
    # Client extracts multiple frames, uploads them, sends image_media_ids
    frame_ids = []
    for i in range(2):
        f = io.BytesIO(TINY_JPEG)
        u = client.post("/v1/media/upload", files={"file": (f"frame_{i}.jpg", f, "image/jpeg")})
        frame_ids.append(u.json()["media_id"])

    res = client.post(
        "/v1/assistant/message",
        json={
            "conversation_id": "test-conv-3",
            "input_mode": "text",
            "image_media_ids": frame_ids,
            "text": "Whitefly pest infestation on tomato",
            "language": "en",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["reply_text"] is not None
    assert data["detected_crop"] == "Tomato"


def test_entry_point_4_voice_only():
    # Entry Point: Voice-only
    # Uploads recorded audio -> calls with input_mode: "voice"
    # MUST call TTS and return audio_url
    audio_file = io.BytesIO(TINY_WAV)
    upload_res = client.post(
        "/v1/media/upload",
        files={"file": ("farmer_voice.wav", audio_file, "audio/wav")},
    )
    audio_media_id = upload_res.json()["media_id"]

    res = client.post(
        "/v1/assistant/message",
        json={
            "conversation_id": "test-conv-4",
            "input_mode": "voice",
            "audio_media_id": audio_media_id,
            "text": "Gehun ki fasal me yellow rust ka upchar batao",  # merged fallback if quiet
            "language": "hi",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["reply_text"] is not None
    assert data["detected_crop"] == "Wheat"
    # When input_mode is voice, audio_url is synthesized for direct playback
    assert data["audio_url"] is not None


def test_entry_point_5_voice_plus_image():
    # Entry Point: Voice + Image
    audio_file = io.BytesIO(TINY_WAV)
    a_res = client.post("/v1/media/upload", files={"file": ("voice.wav", audio_file, "audio/wav")})
    audio_id = a_res.json()["media_id"]

    img_file = io.BytesIO(TINY_JPEG)
    i_res = client.post("/v1/media/upload", files={"file": ("leaf.jpg", img_file, "image/jpeg")})
    image_id = i_res.json()["media_id"]

    res = client.post(
        "/v1/assistant/message",
        json={
            "conversation_id": "test-conv-5",
            "input_mode": "voice",
            "audio_media_id": audio_id,
            "image_media_ids": [image_id],
            "text": "Tamatar me keede lag gaye hain",
            "language": "hi",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["reply_text"] is not None
    assert data["detected_crop"] == "Tomato"
    assert data["audio_url"] is not None


def test_entry_point_6_low_confidence_triggers_followup():
    # Rule 4: If confidence is below 0.70, response MUST carry a follow-up question
    # Passing completely vague query without crop or symptom keywords
    res = client.post(
        "/v1/assistant/message",
        json={
            "conversation_id": "test-conv-6",
            "input_mode": "text",
            "text": "kuch ajeeb lag raha hai khet me",
            "language": "hi",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["is_followup"] is True
    assert data["confidence"] < 0.70
    assert data["follow_up_question"] is not None
    assert "लक्षण" in data["reply_text"] or "फसल" in data["reply_text"] or "फोटो" in data["reply_text"]


if __name__ == "__main__":
    print("Testing Media Upload (Audio & Image)...")
    test_media_upload_audio_and_image()
    print("  -> Passed!")

    print("Testing Entry Point 1 (Plain Text)...")
    test_entry_point_1_plain_text()
    print("  -> Passed!")

    print("Testing Entry Point 2 (Image + Text)...")
    test_entry_point_2_image_plus_text()
    print("  -> Passed!")

    print("Testing Entry Point 3 (Video Derived Frames + Text)...")
    test_entry_point_3_video_derived_frames_plus_text()
    print("  -> Passed!")

    print("Testing Entry Point 4 (Voice Only)...")
    test_entry_point_4_voice_only()
    print("  -> Passed!")

    print("Testing Entry Point 5 (Voice + Image)...")
    test_entry_point_5_voice_plus_image()
    print("  -> Passed!")

    print("Testing Entry Point 6 (Low Confidence Followup Trigger)...")
    test_entry_point_6_low_confidence_triggers_followup()
    print("  -> Passed!")

    print("\nALL 6 ENTRY POINTS AND REQUIREMENTS VERIFIED SUCCESSFULLY!")

