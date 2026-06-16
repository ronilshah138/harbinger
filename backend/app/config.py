from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_KEY: str = "placeholder_key"
    AISSTREAM_API_KEY: str = "placeholder_ais_key"
    REDIS_URL: str = "redis://localhost:6379/0"
    MODEL_STORE_PATH: str = "./models"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
