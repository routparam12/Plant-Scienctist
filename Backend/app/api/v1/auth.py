from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.core.dependencies import bearer_scheme, get_current_user
from app.schemas.auth import (
    EmailOTPRequest,
    EmailOTPVerify,
    OAuthCallbackRequest,
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
        print(f"OTP ERROR: {repr(exc)}")

        raise HTTPException(
            status_code=400,
            detail=str(exc),
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


@router.get("/me")
async def get_current_user_profile(
    user_payload: dict = Depends(get_current_user),
):
    """
    Returns current authenticated user details from Supabase JWT.
    Validates token signature, expiration, issuer, audience and sub claim.
    """
    return {
        "user": {
            "id": user_payload.get("sub"),
            "email": user_payload.get("email"),
            "role": user_payload.get("role", "authenticated"),
        },
        "payload": user_payload,
    }


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """
    Revokes/signs out current Supabase user session using Bearer access token.
    """
    try:
        auth_service.sign_out(credentials.credentials)
        return {
            "success": True,
            "message": "Logged out successfully",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to log out session",
        ) from exc


@router.post("/oauth/callback")
async def oauth_callback(
    data: OAuthCallbackRequest,
):
    """
    Exchanges Google/OAuth code for Supabase access & refresh tokens.
    """
    try:
        response = auth_service.exchange_code_for_session(data.auth_code)
        if not response.session or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired OAuth code",
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth token exchange failed",
        ) from exc