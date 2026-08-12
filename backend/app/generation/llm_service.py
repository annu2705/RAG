from app.config import settings
from app.models.schemas import Citation, RetrievedChunk, TokenUsage
from typing import List, Dict, Any, Tuple
import time
import re

class LLMService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.generator_model = settings.GENERATOR_MODEL
        self.threshold = settings.LLM_RELEVANCE_THRESHOLD

    def _is_context_relevant(self, retrieved_chunks: List[Dict[str, Any]]) -> bool:
        if not retrieved_chunks:
            return False
        max_score = max(c.get("similarity_score", 0.0) for c in retrieved_chunks)
        return max_score >= self.threshold

    def generate_grounded_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        retrieval_latency_ms: float
    ) -> Dict[str, Any]:
        start_time = time.time()

        if not self._is_context_relevant(retrieved_chunks):
            total_latency = (time.time() - start_time) * 1000 + retrieval_latency_ms
            return {
                "question": question,
                "answer": "No relevant information was found in the uploaded documents.",
                "citations": [],
                "retrieved_chunks": [RetrievedChunk(**c) for c in retrieved_chunks],
                "retrieval_latency_ms": round(retrieval_latency_ms, 2),
                "total_latency_ms": round(total_latency, 2),
                "retrieved_chunk_count": len(retrieved_chunks),
                "token_usage": TokenUsage(prompt_tokens=0, completion_tokens=0, total_tokens=0),
                "is_safe_response": True
            }

        context_str = "\n\n".join([
            f"[Chunk ID: {c['chunk_id']} | Source: {c['document_name']} | Page: {c.get('page_number', 'N/A')}]\n{c['chunk_text']}"
            for c in retrieved_chunks
        ])

        system_prompt = (
            "You are a strict, factual Retrieval-Augmented Generation assistant. "
            "Your answer MUST be derived ONLY from the provided document context below. "
            "Do NOT use external knowledge. Do NOT invent facts. "
            "If the answer cannot be determined directly from the context, respond EXACTLY with: "
            "'No relevant information was found in the uploaded documents.' "
            "Always append citations for facts using format [DocName, Page X] or [Chunk ID]."
        )

        user_prompt = f"Context:\n{context_str}\n\nQuestion: {question}\n\nAnswer:"

        answer_text = None
        prompt_tokens = len(user_prompt.split()) + 50
        completion_tokens = 0

        if self.gemini_key:
            try:
                from google import genai
                client = genai.Client(api_key=self.gemini_key)
                response = client.models.generate_content(
                    model=self.generator_model,
                    contents=f"{system_prompt}\n\n{user_prompt}"
                )
                answer_text = response.text
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", prompt_tokens)
                    completion_tokens = getattr(response.usage_metadata, "candidates_token_count", len(answer_text.split()))
            except Exception as e:
                print(f"Gemini API Generation Error: {type(e).__name__}: {e}")
                answer_text = None

        if not answer_text and self.openai_key:
            try:
                import openai
                client = openai.OpenAI(api_key=self.openai_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1
                )
                answer_text = response.choices[0].message.content
                if response.usage:
                    prompt_tokens = response.usage.prompt_tokens
                    completion_tokens = response.usage.completion_tokens
            except Exception:
                answer_text = None

        if not answer_text:
            answer_text, citations_list = self._extractive_grounded_fallback(question, retrieved_chunks)
            completion_tokens = len(answer_text.split())
        else:
            citations_list = self._extract_citations(retrieved_chunks)

        total_tokens = prompt_tokens + completion_tokens
        total_latency = (time.time() - start_time) * 1000 + retrieval_latency_ms

        is_safe = "No relevant information was found" in answer_text

        return {
            "question": question,
            "answer": answer_text,
            "citations": citations_list,
            "retrieved_chunks": [RetrievedChunk(**c) for c in retrieved_chunks],
            "retrieval_latency_ms": round(retrieval_latency_ms, 2),
            "total_latency_ms": round(total_latency, 2),
            "retrieved_chunk_count": len(retrieved_chunks),
            "token_usage": TokenUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens
            ),
            "is_safe_response": is_safe
        }

    def _extractive_grounded_fallback(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, List[Citation]]:
        top_chunk = retrieved_chunks[0]
        text = top_chunk["chunk_text"]
        doc_name = top_chunk["document_name"]
        page_num = top_chunk.get("page_number")
        
        q_words = set(re.findall(r'\w+', question.lower())) - {"what", "is", "the", "how", "why", "where", "are", "in", "of", "to", "a", "an"}
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        best_sentence = sentences[0]
        max_overlap = -1
        for s in sentences:
            s_words = set(re.findall(r'\w+', s.lower()))
            overlap = len(q_words.intersection(s_words))
            if overlap > max_overlap:
                max_overlap = overlap
                best_sentence = s

        if max_overlap == 0 and len(retrieved_chunks) > 1:
            best_sentence = text[:300] + "..."

        page_str = f", Page {page_num}" if page_num else ""
        answer = f"{best_sentence.strip()} [{doc_name}{page_str}]"
        
        citations = [Citation(
            document_name=top_chunk["document_name"],
            page_number=top_chunk.get("page_number"),
            chunk_id=top_chunk["chunk_id"],
            source=top_chunk["source"]
        )]
        return answer, citations

    def _extract_citations(self, retrieved_chunks: List[Dict[str, Any]]) -> List[Citation]:
        seen = set()
        citations = []
        for c in retrieved_chunks:
            key = (c["document_name"], c.get("page_number"), c["chunk_id"])
            if key not in seen:
                seen.add(key)
                citations.append(Citation(
                    document_name=c["document_name"],
                    page_number=c.get("page_number"),
                    chunk_id=c["chunk_id"],
                    source=c["source"]
                ))
        return citations

llm_service = LLMService()
