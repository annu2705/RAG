from app.ingestion.extractors import TextExtractor
from app.ingestion.chunker import Chunker
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store_service
from app.generation.llm_service import llm_service
from app.services.cost_service import cost_service
from app.config import settings
from pathlib import Path


def test_extractors():
    sample_dir = Path(settings.DATA_DIR) / "sample_documents"
    html_file = sample_dir / "vector_databases_comparison.html"
    md_file = sample_dir / "rag_architecture_guide.md"

    if html_file.exists():
        pages = TextExtractor.extract(str(html_file), "html")
        assert len(pages) > 0
        assert "ChromaDB" in pages[0]["text"]

    if md_file.exists():
        pages = TextExtractor.extract(str(md_file), "md")
        assert len(pages) > 0
        assert len(pages[0]["text"]) > 0


def test_chunker_hashing_and_idempotency():
    sample_pages = [{
        "page_number": 1,
        "text": "This is a test document content for chunking."
    }]
    hash1, chunks1 = Chunker.chunk_pages(
        sample_pages, chunk_size=100, chunk_overlap=20
    )
    hash2, chunks2 = Chunker.chunk_pages(
        sample_pages, chunk_size=100, chunk_overlap=20
    )

    assert hash1 == hash2
    assert len(chunks1) == len(chunks2)
    assert chunks1[0]["chunk_id"] == chunks2[0]["chunk_id"]


def test_embedding_service():
    embeddings = embedding_service.embed_texts(
        ["Hello world", "RAG vector retrieval"]
    )
    assert len(embeddings) == 2
    assert len(embeddings[0]) == settings.EMBEDDING_DIMENSION


def test_vector_store_upsert_and_idempotency():
    doc_id = "test_doc_001"
    doc_name = "test_document.txt"
    pages = [{
        "page_number": 1,
        "text": "Unique test content for vector store persistence."
    }]
    doc_hash, chunks = Chunker.chunk_pages(
        pages, chunk_size=200, chunk_overlap=20
    )
    embeddings = embedding_service.embed_texts(
        [c["chunk_text"] for c in chunks]
    )

    res1 = vector_store_service.upsert_document(
        document_id=doc_id,
        document_name=doc_name,
        file_type="txt",
        file_size_bytes=100,
        content_hash=doc_hash,
        chunks=chunks,
        embeddings=embeddings
    )
    assert res1["status"] == "success"

    res2 = vector_store_service.upsert_document(
        document_id=doc_id,
        document_name=doc_name,
        file_type="txt",
        file_size_bytes=100,
        content_hash=doc_hash,
        chunks=chunks,
        embeddings=embeddings
    )
    assert res2["is_reingest"] is True
    assert res2["new_vectors_added"] == 0


def test_vector_store_search():
    q_embed = embedding_service.embed_query("test content")
    results = vector_store_service.search(q_embed, top_k=2)
    assert isinstance(results, list)


def test_grounded_llm_generation_with_citations():
    mock_chunks = [{
        "chunk_id": "c1",
        "document_name": "guide.pdf",
        "page_number": 2,
        "source": "guide.pdf",
        "chunk_text": "The recommended chunk size is 500 characters.",
        "similarity_score": 0.85,
        "chunk_index": 0
    }]
    res = llm_service.generate_grounded_answer(
        "What is the chunk size?", mock_chunks, 15.0
    )
    assert "answer" in res
    assert len(res["citations"]) > 0
    assert res["is_safe_response"] is False


def test_no_context_safe_fallback():
    unrelated_chunks = [{
        "chunk_id": "c2",
        "document_name": "guide.pdf",
        "page_number": 1,
        "source": "guide.pdf",
        "chunk_text": "Random text about apples.",
        "similarity_score": 0.1,
        "chunk_index": 0
    }]
    res = llm_service.generate_grounded_answer(
        "What is superluminal quantum bandwidth?", unrelated_chunks, 10.0
    )
    assert "No relevant information was found" in res["answer"]
    assert res["is_safe_response"] is True


def test_cost_service():
    costs = cost_service.calculate_costs()
    assert "comparisons" in costs
    assert len(costs["comparisons"]) == 3
    assert costs["comparisons"][0]["savings_percentage"] > 0
