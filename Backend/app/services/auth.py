from app.core.supabase import supabase


class AuthService:

    @staticmethod
    def request_email_otp(email: str):
        return supabase.auth.sign_in_with_otp({
            "email": email,
        })

    @staticmethod
    def verify_email_otp(email: str, token: str):
        return supabase.auth.verify_otp({
            "email": email,
            "token": token,
            "type": "email",
        })

    @staticmethod
    def refresh_session(refresh_token: str):
        return supabase.auth.refresh_session(
            refresh_token
        )

    @staticmethod
    def exchange_code_for_session(auth_code: str):
        return supabase.auth.exchange_code_for_session({
            "auth_code": auth_code,
        })

    @staticmethod
    def sign_out(access_token: str):
        return supabase.auth.sign_out(access_token)


auth_service = AuthService()