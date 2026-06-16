from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_db() -> Client:
    """
    Returns the Supabase Client. Can be used in FastAPI dependency injection.
    """
    return supabase
