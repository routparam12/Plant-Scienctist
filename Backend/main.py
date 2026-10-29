from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.me import router as me_router
from app.api.v1.voice import router as voice_router
from app.api.v1.crops import router as crops_router
from app.api.v1.farms import router as farms_router
from app.api.v1.diagnoses import router as diagnoses_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.media import router as media_router


app = FastAPI(
    title="Plant Scientist API",
    description="Multilingual Agricultural Diagnosis, Voice Assistant & Farm Management Backend",
    version="1.0.0",
)

from fastapi.responses import JSONResponse
from app.core.exceptions import NotFound, UpstreamError

# Robust Cross-Origin Resource Sharing (CORS) for Mobile (Expo/React Native) and Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Disposition",
        "X-Transcribed-Text",
        "X-Plant-Response",
        "X-Detected-Language",
    ],
)


@app.exception_handler(NotFound)
async def not_found_handler(request, exc: NotFound):
    return JSONResponse(status_code=404, content={"detail": f"{exc.resource} not found"})


@app.exception_handler(UpstreamError)
async def upstream_error_handler(request, exc: UpstreamError):
    return JSONResponse(status_code=503, content={"detail": exc.message})

# Route Registrations under /v1
app.include_router(auth_router, prefix="/v1")
app.include_router(me_router, prefix="/v1")
app.include_router(crops_router, prefix="/v1")
app.include_router(farms_router, prefix="/v1")
app.include_router(diagnoses_router, prefix="/v1")
app.include_router(assistant_router, prefix="/v1")
app.include_router(media_router, prefix="/v1")

# Voice endpoints (also available at /voice and /v1/voice)
app.include_router(voice_router)
app.include_router(voice_router, prefix="/v1")



@app.get("/health")
@app.get("/v1/health")
async def health():
    return {
        "status": "ok",
        "service": "Plant Scientist Backend",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    # Bind explicitly to 0.0.0.0 so physical devices on the local WiFi network can connect
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)