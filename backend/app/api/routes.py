from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import Optional, List, Dict, Any
import os
import shutil
import tempfile
from pathlib import Path

from app.config import settings
from app.models.schemas import (
    IngestResponse, QueryRequest, QueryResponse, 
    DocumentInfo, SystemStats, ConfigSettingsResponse
)
from app.ingestion.extractors import TextExtractor
from app.ingestion.chunker import Chunker
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store_service
from app.generation.llm_service import llm_service
from app.services.logger_service import logger_service
from app.services.cost_service import cost_service
from app.evaluation.harness import evaluation_harness

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "Cost-Efficient RAG API", "vector_store": "ChromaDB"}

@router.get("/config", response_model=ConfigSettingsResponse)
def get_configuration():
    return ConfigSettingsResponse(
        vector_store="ChromaDB",
        embedding_model=settings.EMBEDDING_MODEL_NAME,
        embedding_dimension=settings.EMBEDDING_DIMENSION,
        default_chunk_size=settings.DEFAULT_CHUNK_SIZE,
        default_chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP,
        default_top_k=settings.DEFAULT_TOP_K,
        generator_model=settings.GENERATOR_MODEL,
        judge_model=settings.JUDGE_MODEL
    )

@router.get("/stats", response_model=SystemStats)
def get_system_stats():
    stats = vector_store_service.get_stats()
    logs = logger_service.get_recent_logs(limit=100)
    stats["recent_queries_count"] = len(logs)
    return SystemStats(**stats)

@router.post("/documents/ingest", response_model=IngestResponse)
async def ingest_document(
    file: UploadFile = File(...),
    chunk_size: Optional[int] = Form(None),
    chunk_overlap: Optional[int] = Form(None)
):
    c_size = chunk_size or settings.DEFAULT_CHUNK_SIZE
    c_overlap = chunk_overlap or settings.DEFAULT_CHUNK_OVERLAP

    suffix = Path(file.filename).suffix.lower()
    if suffix not in [".pdf", ".html", ".htm", ".md", ".markdown", ".txt"]:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {suffix}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        pages = TextExtractor.extract(tmp_path, suffix.lstrip("."))
        file_size = os.path.getsize(tmp_path)
        doc_hash, chunks = Chunker.chunk_pages(pages, c_size, c_overlap)
        
        texts = [c["chunk_text"] for c in chunks]
        embeddings = embedding_service.embed_texts(texts)

        doc_id = f"doc_{doc_hash[:12]}"
        
        res = vector_store_service.upsert_document(
            document_id=doc_id,
            document_name=file.filename,
            file_type=suffix.lstrip("."),
            file_size_bytes=file_size,
            content_hash=doc_hash,
            chunks=chunks,
            embeddings=embeddings
        )

        return IngestResponse(**res)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.get("/documents", response_model=List[DocumentInfo])
def list_documents():
    docs = vector_store_service.list_documents()
    return [DocumentInfo(**d) for d in docs]

@router.delete("/documents/{document_id}")
def delete_document(document_id: str):
    success = vector_store_service.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or delete failed")
    return {"status": "success", "deleted_document_id": document_id}

@router.post("/query", response_model=QueryResponse)
def query_rag(req: QueryRequest):
    top_k = req.top_k or settings.DEFAULT_TOP_K
    
    import time
    r_start = time.time()
    query_embedding = embedding_service.embed_query(req.question)
    retrieved_chunks = vector_store_service.search(
        query_embedding=query_embedding,
        top_k=top_k,
        metadata_filter=req.metadata_filter
    )
    retrieval_ms = (time.time() - r_start) * 1000.0

    result = llm_service.generate_grounded_answer(req.question, retrieved_chunks, retrieval_ms)

    logger_service.log_query_execution(
        question=req.question,
        retrieval_latency_ms=result["retrieval_latency_ms"],
        total_latency_ms=result["total_latency_ms"],
        retrieved_chunk_count=result["retrieved_chunk_count"],
        top_k=top_k,
        token_usage=result["token_usage"].model_dump(),
        is_safe_response=result["is_safe_response"]
    )

    return QueryResponse(**result)

@router.get("/logs")
def get_logs(limit: int = Query(50, ge=1, le=200)):
    return logger_service.get_recent_logs(limit=limit)

@router.get("/cost-analysis")
def get_cost_analysis():
    return cost_service.calculate_costs()

@router.post("/evaluation/run")
def run_evaluation():
    summary = evaluation_harness.run_evaluation()
    return {"status": "completed", "summary": summary}

@router.get("/evaluation/results")
def get_evaluation_results():
    summary_path = Path(settings.RESULTS_DIR) / "evaluation_summary.json"
    if not summary_path.exists():
        return {"status": "not_run", "message": "Evaluation has not been executed yet."}
    
    import json
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    retrieval_path = Path(settings.RESULTS_DIR) / "retrieval_results.json"
    retrieval_data = {}
    if retrieval_path.exists():
        with open(retrieval_path, "r", encoding="utf-8") as f:
            retrieval_data = json.load(f)

    return {"status": "completed", "summary": summary, "retrieval": retrieval_data}
