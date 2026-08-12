import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from app.services.embedding_service import embedding_service
from typing import List, Dict, Any, Optional
import datetime
import os

class VectorStoreService:
    def __init__(self, collection_name: str = "rag_documents"):
        os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
        self.collection_name = collection_name
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def upsert_document(
        self,
        document_id: str,
        document_name: str,
        file_type: str,
        file_size_bytes: int,
        content_hash: str,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> Dict[str, Any]:
        existing_count = self.collection.count()
        
        existing = self.collection.get(
            where={"content_hash": content_hash}
        )
        is_reingest = len(existing.get("ids", [])) > 0
        
        ids = [c["chunk_id"] for c in chunks]
        texts = [c["chunk_text"] for c in chunks]
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        
        metadatas = []
        for c in chunks:
            metadatas.append({
                "document_id": document_id,
                "document_name": document_name,
                "file_type": file_type,
                "file_size_bytes": file_size_bytes,
                "content_hash": content_hash,
                "chunk_id": c["chunk_id"],
                "chunk_index": c["chunk_index"],
                "page_number": int(c.get("page_number", 1)),
                "source": document_name,
                "ingestion_timestamp": timestamp,
                "embedding_model": embedding_service.model_name,
                "embedding_dimension": embedding_service.dimension
            })

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

        new_count = self.collection.count()
        added_vectors = new_count - existing_count

        return {
            "document_id": document_id,
            "document_name": document_name,
            "file_type": file_type,
            "file_size_bytes": file_size_bytes,
            "chunk_count": len(chunks),
            "new_vectors_added": added_vectors if not is_reingest else 0,
            "is_reingest": is_reingest,
            "status": "success",
            "ingestion_timestamp": timestamp
        }

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 4,
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        where_clause = metadata_filter if metadata_filter else None
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_clause,
            include=["documents", "metadatas", "distances"]
        )

        retrieved = []
        if results and results.get("documents") and results["documents"][0]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            ids = results["ids"][0]
            distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

            for i in range(len(docs)):
                dist = distances[i]
                sim_score = max(0.0, 1.0 - dist)
                meta = metas[i]
                retrieved.append({
                    "chunk_id": ids[i],
                    "document_name": meta.get("document_name", "Unknown"),
                    "page_number": meta.get("page_number"),
                    "source": meta.get("source", "Unknown"),
                    "chunk_text": docs[i],
                    "similarity_score": round(sim_score, 4),
                    "chunk_index": meta.get("chunk_index", 0)
                })

        return retrieved

    def delete_document(self, document_id: str) -> bool:
        try:
            self.collection.delete(where={"document_id": document_id})
            return True
        except Exception:
            return False

    def list_documents(self) -> List[Dict[str, Any]]:
        all_items = self.collection.get(include=["metadatas"])
        metas = all_items.get("metadatas", [])
        
        docs_map = {}
        for m in metas:
            doc_id = m.get("document_id")
            if doc_id and doc_id not in docs_map:
                docs_map[doc_id] = {
                    "document_id": doc_id,
                    "document_name": m.get("document_name"),
                    "file_type": m.get("file_type"),
                    "file_size_bytes": m.get("file_size_bytes", 0),
                    "chunk_count": 0,
                    "content_hash": m.get("content_hash"),
                    "ingestion_timestamp": m.get("ingestion_timestamp")
                }
            if doc_id:
                docs_map[doc_id]["chunk_count"] += 1
                
        return list(docs_map.values())

    def get_stats(self) -> Dict[str, Any]:
        docs = self.list_documents()
        total_vectors = self.collection.count()
        total_chunks = sum(d["chunk_count"] for d in docs)
        
        return {
            "total_documents": len(docs),
            "total_chunks": total_chunks if total_chunks > 0 else total_vectors,
            "total_vectors": total_vectors,
            "vector_store": "ChromaDB",
            "embedding_model": embedding_service.model_name,
            "embedding_dimension": embedding_service.dimension,
            "status": "healthy"
        }

vector_store_service = VectorStoreService()
