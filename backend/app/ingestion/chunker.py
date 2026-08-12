import hashlib
from typing import List, Dict, Any

class Chunker:
    @staticmethod
    def compute_content_hash(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    @classmethod
    def chunk_pages(
        cls,
        pages: List[Dict[str, Any]],
        chunk_size: int = 500,
        chunk_overlap: int = 50
    ) -> tuple[str, List[Dict[str, Any]]]:
        full_text = "\n".join([p["text"] for p in pages])
        doc_hash = cls.compute_content_hash(full_text)
        
        chunks = []
        chunk_index = 0
        
        step = max(1, chunk_size - chunk_overlap)
        
        for p in pages:
            page_text = p["text"]
            page_num = p.get("page_number", 1)
            
            if len(page_text) <= chunk_size:
                chunks.append({
                    "chunk_id": f"{doc_hash}_{chunk_index}",
                    "chunk_index": chunk_index,
                    "chunk_text": page_text,
                    "page_number": page_num,
                    "doc_hash": doc_hash
                })
                chunk_index += 1
            else:
                for i in range(0, len(page_text), step):
                    sub_text = page_text[i:i + chunk_size].strip()
                    if sub_text:
                        chunks.append({
                            "chunk_id": f"{doc_hash}_{chunk_index}",
                            "chunk_index": chunk_index,
                            "chunk_text": sub_text,
                            "page_number": page_num,
                            "doc_hash": doc_hash
                        })
                        chunk_index += 1

        return doc_hash, chunks
