from app.config import settings
from typing import Dict, Any, List
import json
import os
from pathlib import Path

class CostAnalysisService:
    def __init__(self):
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
        self.results_dir = Path(settings.RESULTS_DIR)

    def calculate_costs(self) -> Dict[str, Any]:
        scales = [100000, 1000000, 10000000]
        results = []

        bytes_per_float = 4
        vector_bytes = self.embedding_dimension * bytes_per_float
        hnsw_overhead_factor = 1.5
        total_bytes_per_vector = vector_bytes * hnsw_overhead_factor

        ebs_price_per_gb_month = 0.08
        managed_storage_per_gb_month = 0.25
        managed_vector_base_price_per_million = 60.0

        for scale in scales:
            raw_storage_gb = (scale * total_bytes_per_vector) / (1024 ** 3)
            
            if scale <= 100000:
                compute_vm_monthly = 15.0
                managed_compute_base = 40.0
            elif scale <= 1000000:
                compute_vm_monthly = 30.0
                managed_compute_base = 120.0
            else:
                compute_vm_monthly = 120.0
                managed_compute_base = 500.0

            ebs_storage_cost = max(raw_storage_gb * ebs_price_per_gb_month, 1.0)
            chromadb_monthly = compute_vm_monthly + ebs_storage_cost

            managed_storage_cost = raw_storage_gb * managed_storage_per_gb_month
            managed_vector_cost = (scale / 1000000.0) * managed_vector_base_price_per_million
            managed_monthly = managed_compute_base + managed_storage_cost + managed_vector_cost

            monthly_savings = managed_monthly - chromadb_monthly
            savings_pct = (monthly_savings / managed_monthly) * 100.0 if managed_monthly > 0 else 0.0

            results.append({
                "scale_vectors": scale,
                "raw_storage_gb": round(raw_storage_gb, 2),
                "chromadb_monthly_cost_usd": round(chromadb_monthly, 2),
                "managed_db_monthly_cost_usd": round(managed_monthly, 2),
                "monthly_savings_usd": round(monthly_savings, 2),
                "savings_percentage": round(savings_pct, 1),
                "chromadb_breakdown": {
                    "compute_vm": f"${compute_vm_monthly}/mo",
                    "ebs_storage": f"${round(ebs_storage_cost, 2)}/mo ({round(raw_storage_gb, 2)} GB)"
                },
                "managed_breakdown": {
                    "base_tier": f"${managed_compute_base}/mo",
                    "vector_fee": f"${round(managed_vector_cost, 2)}/mo",
                    "storage_fee": f"${round(managed_storage_cost, 2)}/mo"
                }
            })

        output = {
            "comparisons": results,
            "assumptions": {
                "embedding_dimension": self.embedding_dimension,
                "bytes_per_vector_element": bytes_per_float,
                "hnsw_index_overhead_multiplier": hnsw_overhead_factor,
                "ebs_gp3_price_per_gb_month": ebs_price_per_gb_month,
                "managed_storage_price_per_gb_month": managed_storage_per_gb_month,
                "managed_vector_price_per_million": managed_vector_base_price_per_million,
                "monthly_query_volume_assumed": "100,000 queries"
            }
        }

        os.makedirs(self.results_dir, exist_ok=True)
        with open(self.results_dir / "cost_comparison.json", "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)

        return output

cost_service = CostAnalysisService()
