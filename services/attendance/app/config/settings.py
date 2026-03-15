from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):

    port: int = 4001
    service_name: str = "attendance-service"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://reilfereduv:devpassword123@postgres:5432/reilfereduv"

    redis_host: str = "redis"
    redis_port: int = 6379

    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    jwt_secret: str = "your_jwt_secret_here"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
