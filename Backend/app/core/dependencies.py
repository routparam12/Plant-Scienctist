from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import verify_access_token


bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials,
        Depends(bearer_scheme),
    ],
) -> dict:

    payload = await verify_access_token(
        credentials.credentials
    )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    return payload


optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials],
        Depends(optional_bearer),
    ] = None,
) -> Optional[dict]:
    if not credentials or not credentials.credentials:
        return None
    try:
        return await verify_access_token(credentials.credentials)
    except Exception:
        return None