import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))
    GENERATOR_MODEL: str = os.getenv("GENERATOR_MODEL", "gemini-flash-latest")
    JUDGE_MODEL: str = os.getenv("JUDGE_MODEL", "gemini-flash-latest")
    CHROMA_PERSIST_DIRECTORY: str = str(BASE_DIR / os.getenv("CHROMA_PERSIST_DIRECTORY", "data/chroma_db"))
    DEFAULT_CHUNK_SIZE: int = int(os.getenv("DEFAULT_CHUNK_SIZE", "500"))
    DEFAULT_CHUNK_OVERLAP: int = int(os.getenv("DEFAULT_CHUNK_OVERLAP", "50"))
    DEFAULT_TOP_K: int = int(os.getenv("DEFAULT_TOP_K", "4"))
    LLM_RELEVANCE_THRESHOLD: float = float(os.getenv("LLM_RELEVANCE_THRESHOLD", "0.35"))
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    DATA_DIR: str = str(BASE_DIR / "data")
    RESULTS_DIR: str = str(BASE_DIR / "results")
    LOGS_DIR: str = str(BASE_DIR / "logs")

settings = Settings()
