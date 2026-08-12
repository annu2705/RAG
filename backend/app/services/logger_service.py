import json
import os
import time
from pathlib import Path
from typing import Dict, Any, List
from app.config import settings

class LoggerService:
    def __init__(self):
        self.log_dir = Path(settings.LOGS_DIR)
        os.makedirs(self.log_dir, exist_ok=True)
        self.query_log_file = self.log_dir / "query_audit.jsonl"

    def log_query_execution(
        self,
        question: str,
        retrieval_latency_ms: float,
        total_latency_ms: float,
        retrieved_chunk_count: int,
        top_k: int,
        token_usage: Dict[str, int],
        is_safe_response: bool
    ):
        entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "question": question,
            "retrieval_latency_ms": round(retrieval_latency_ms, 2),
            "total_latency_ms": round(total_latency_ms, 2),
            "retrieved_chunk_count": retrieved_chunk_count,
            "top_k": top_k,
            "token_usage": token_usage,
            "is_safe_response": is_safe_response
        }

        with open(self.query_log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

    def get_recent_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.query_log_file.exists():
            return []
        
        logs = []
        with open(self.query_log_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    try:
                        logs.append(json.loads(line))
                    except Exception:
                        pass
        return logs[-limit:][::-1]

logger_service = LoggerService()
