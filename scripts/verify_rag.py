import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8001/api"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode('utf-8'))

def post(path, data):
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("--- VERIFYING BACKEND ENDPOINTS ---")
health = get("/health")
print("1. Health Status:", health)

stats = get("/stats")
print("2. System Stats:", stats)

print("\n--- TESTING RAG QUERY & CITATIONS ---")
query_resp = post("/query", {
    "question": "What is the recommended chunk size and overlap for document chunking?",
    "top_k": 4
})
print("Answer:", query_resp["answer"])
print("Citations Count:", len(query_resp["citations"]))
print("Retrieval Latency:", query_resp["retrieval_latency_ms"], "ms")
print("Is Safe Response:", query_resp["is_safe_response"])

print("\n--- TESTING NO-CONTEXT SAFE RESPONSE ---")
no_context_resp = post("/query", {
    "question": "What is Quantum Teleportation Superluminal Bandwidth Limit?",
    "top_k": 4
})
print("No-Context Answer:", no_context_resp["answer"])
print("Is Safe Response:", no_context_resp["is_safe_response"])

print("\n--- TESTING COST ANALYSIS ---")
cost_resp = get("/cost-analysis")
print("100K Scale Savings:", cost_resp["comparisons"][0]["savings_percentage"], "%")

print("\n--- TESTING EVALUATION HARNESS ---")
eval_resp = post("/evaluation/run", {})
print("Evaluation Summary Status:", eval_resp["status"])
print("Recall@K:", eval_resp["summary"]["retrieval_metrics"]["recall_at_k"])
print("MRR:", eval_resp["summary"]["retrieval_metrics"]["mrr"])
print("Faithfulness:", eval_resp["summary"]["answer_quality_metrics"]["faithfulness"])
