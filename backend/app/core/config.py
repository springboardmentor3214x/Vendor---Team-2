from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vendor Reliability Intelligence Platform"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "33682915858cf85d7b5bdee5662bb1e51ba0e98031d22f7b447e1bc85d2dd76d"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 
    
    # We will use SQLite for fast local deployment
    DATABASE_URL: str = "sqlite:///./backend_data.db"
    
    class Config:
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()
