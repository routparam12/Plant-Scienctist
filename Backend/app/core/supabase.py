import httpx
from supabase import Client, create_client, ClientOptions

from app.core.config import settings

# 30-second timeout ensures Supabase Auth email/SMTP and database operations never abort prematurely
_http_client = httpx.Client(timeout=30.0)
_client_options = ClientOptions(httpx_client=_http_client)

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_secret_key,
    options=_client_options,
)