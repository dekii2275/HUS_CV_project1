from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Database
    POSTGRES_URL: str = "postgresql://itms_user:itms_pass@localhost:5432/itms_db"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 18000
    
    # LLM Configuration
    LLM_PROVIDER: str = "ollama"  # "ollama" hoặc "openai"
    
    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    
    # Vector Store
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    
    # Reporting
    REPORT_SCHEDULE_HOUR: int = 23
    REPORT_SCHEDULE_MINUTE: int = 55

settings = Settings()
