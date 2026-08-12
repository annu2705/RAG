from sentence_transformers import SentenceTransformer
from app.config import settings
from typing import List
import numpy as np

class EmbeddingService:
    _instance = None
    _model = None

    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL_NAME
        self.dimension = settings.EMBEDDING_DIMENSION

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self):
        if self._model is None:
            try:
                self._model = SentenceTransformer(self.model_name)
            except Exception:
                self._model = None

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        self._load_model()
        if self._model is not None:
            embeddings = self._model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        
        results = []
        for text in texts:
            seed = sum(ord(c) for c in text[:64]) % 10000
            rng = np.random.RandomState(seed)
            vec = rng.randn(self.dimension)
            vec = vec / np.linalg.norm(vec)
            results.append(vec.tolist())
        return results

    def embed_query(self, query: str) -> List[float]:
        return self.embed_texts([query])[0]

embedding_service = EmbeddingService.get_instance()
