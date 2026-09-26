import jwt
from fastapi import HTTPException, status

from app.core.config import settings


async def verify_access_token(token: str) -> dict:
    try:
        jwks_client = jwt.PyJWKClient(
            settings.supabase_jwks_url
        )

        signing_key = jwks_client.get_signing_key_from_jwt(
            token
        )

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience="authenticated",
        )

        return payload

    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc