from fastapi import APIRouter, HTTPException

from app.schemas.auth import (
    EmailOTPRequest,
    EmailOTPVerify,
    RefreshTokenRequest,
)
from app.services.auth import auth_service


router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.post("/otp/request")
async def request_email_otp(
    data: EmailOTPRequest,
):
    try:
        auth_service.request_email_otp(
            data.email
        )

        return {
            "success": True,
            "message": "OTP sent successfully",
        }

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to send OTP",
        ) from exc


@router.post("/otp/verify")
async def verify_email_otp(
    data: EmailOTPVerify,
):
    try:
        response = auth_service.verify_email_otp(
            data.email,
            data.token,
        )

        if not response.session or not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired OTP",
            )

        session = response.session
        user = response.user

        return {
            "user": {
                "id": user.id,
                "email": user.email,
            },
            "session": {
                "access_token": session.access_token,
                "refresh_token": session.refresh_token,
                "expires_in": session.expires_in,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired OTP",
        ) from exc


@router.post("/refresh")
async def refresh_session(
    data: RefreshTokenRequest,
):
    try:
        response = auth_service.refresh_session(
            data.refresh_token
        )

        if not response.session:
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token",
            )

        session = response.session

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "expires_in": session.expires_in,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail="Unable to refresh session",
        ) from exc