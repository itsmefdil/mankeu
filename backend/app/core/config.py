from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator, ValidationError
from typing import List, Union
import os
import sys
import warnings
from pathlib import Path
from dotenv import load_dotenv

# /app/core/config.py -> /app/core -> /app -> /backend
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
env_path = PROJECT_ROOT / ".env"

# Load .env file
if not load_dotenv(dotenv_path=env_path):
    warnings.warn(f"WARNING: .env file not found at {env_path}. Application may not work as expected.", UserWarning)

class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str
    
    # CORS
    CORS_ALLOW_ALL_ORIGINS: bool = False
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 262800 # 6 months

    class Config:
        case_sensitive = True
        # Pydantic will read from os.environ, which is populated by load_dotenv
        # We can also keep env_file as a fallback or for direct pydantic support
        env_file = str(PROJECT_ROOT / ".env")

try:
    settings = Settings()
except ValidationError as e:
    print("\n" + "="*50)
    print("CONFIGURATION ERROR")
    print("="*50)
    print(f"Failed to load configuration from {env_path}")
    print("Missing or invalid environment variables:")
    
    for error in e.errors():
        field = " -> ".join(str(x) for x in error['loc'])
        msg = error['msg']
        print(f"  - {field}: {msg}")
    
    print("="*50 + "\n")
    sys.exit(1)
