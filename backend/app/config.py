from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://voltra:voltra@localhost:5432/voltra"
    secret_key: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days
    frontend_origin: str = "http://localhost:3000"
    cookie_name: str = "voltra_token"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
