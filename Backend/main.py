from fastapi import FastAPI

from app.api.v1.auth import router as auth_router


app = FastAPI(
    title="Plant Scientist API",
    version="0.1.0",
)


app.include_router(
    auth_router,
    prefix="/v1",
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
    }