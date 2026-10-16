import logging
import jwt
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.supabase import supabase

logger = logging.getLogger("auth_security")

# Global PyJWKClient instance to leverage key caching across requests
jwks_client = jwt.PyJWKClient(
    settings.supabase_jwks_url,
    cache_keys=True,
)


async def verify_access_token(token: str) -> dict:
    # 1. Fast path: Asymmetric JWKS validation
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256", "HS256"],
            audience="authenticated",
        )
        return payload
    except Exception as exc:
        logger.debug(f"[verify_access_token] JWKS decode failed: {exc}")

    # 2. Resilient fallback: Direct Supabase Auth API validation
    try:
        user_res = supabase.auth.get_user(token)
        if user_res and user_res.user:
            user = user_res.user
            return {
                "sub": user.id,
                "email": user.email,
                "role": getattr(user, "role", "authenticated"),
                "app_metadata": getattr(user, "app_metadata", {}),
                "user_metadata": getattr(user, "user_metadata", {}),
            }
    except Exception as exc:
        logger.warning(f"[verify_access_token] Supabase auth.get_user failed: {exc}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
    )