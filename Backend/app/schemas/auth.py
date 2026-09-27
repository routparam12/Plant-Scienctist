from pydantic import BaseModel, EmailStr, Field


class EmailOTPRequest(BaseModel):
    email: EmailStr


class EmailOTPVerify(BaseModel):
    email: EmailStr
    token: str = Field(min_length=6, max_length=6)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class OAuthCallbackRequest(BaseModel):
    auth_code: str