from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DocumentInfo(BaseModel):
    document_id: str
    document_name: str
    file_type: str
    file_size_bytes: int
    chunk_count: int
    content_hash: str
    ingestion_timestamp: str

class IngestResponse(BaseModel):
    document_id: str
    document_name: str
    file_type: str
    file_size_bytes: int
    chunk_count: int
    new_vectors_added: int
    is_reingest: bool
    status: str
    ingestion_timestamp: str

class Citation(BaseModel):
    document_name: str
    page_number: Optional[int] = None
    chunk_id: str
    source: str

class RetrievedChunk(BaseModel):
    chunk_id: str
    document_name: str
    page_number: Optional[int] = None
    source: str
    chunk_text: str
    similarity_score: float
    chunk_index: int

class QueryRequest(BaseModel):
    question: str
    top_k: Optional[int] = None
    metadata_filter: Optional[Dict[str, Any]] = None

class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class QueryResponse(BaseModel):
    question: str
    answer: str
    citations: List[Citation]
    retrieved_chunks: List[RetrievedChunk]
    retrieval_latency_ms: float
    total_latency_ms: float
    retrieved_chunk_count: int
    token_usage: TokenUsage
    is_safe_response: bool

class SystemStats(BaseModel):
    total_documents: int
    total_chunks: int
    total_vectors: int
    vector_store: str
    embedding_model: str
    embedding_dimension: int
    recent_queries_count: int
    status: str

class CostEstimate(BaseModel):
    scale_vectors: int
    chromadb_estimated_monthly_cost: float
    managed_estimated_monthly_cost: float
    cost_difference_percent: float
    assumptions: Dict[str, Any]

class EvaluationMetrics(BaseModel):
    recall_at_k: float
    mrr: float
    ndcg_at_k: float
    context_precision: float
    faithfulness: float
    answer_relevance: float
    exact_match: float
    f1_score: float
    retrieval_p50_ms: float
    retrieval_p95_ms: float

class ConfigSettingsResponse(BaseModel):
    vector_store: str
    embedding_model: str
    embedding_dimension: int
    default_chunk_size: int
    default_chunk_overlap: int
    default_top_k: int
    generator_model: str
    judge_model: str
