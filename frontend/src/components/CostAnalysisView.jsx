import React, { useState, useEffect } from 'react';
import { getCostAnalysis } from '../apiClient';
import { DollarSign, Database, HardDrive, Info } from 'lucide-react';

export default function CostAnalysisView() {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCostAnalysis()
      .then(res => setCostData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        <DollarSign className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        Calculating vector infrastructure costs...
      </div>
    );
  }

  const comparisons = costData?.comparisons || [];
  const assumptions = costData?.assumptions || {};

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Infrastructure Cost & Scalability Analysis</h2>
        <p className="text-sm text-slate-500 mt-1">Detailed cost comparison of local ChromaDB architecture vs. Cloud Managed Vector DBs across vector scales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {comparisons.map((c, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-5 glass-panel-hover flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">
                  {(c.scale_vectors / 1000).toFixed(0)}K Scale
                </span>
                <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded">
                  -{c.savings_percentage}% Savings
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">ChromaDB Self-Hosted</span>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    ${c.chromadb_monthly_cost_usd}
                    <span className="text-xs font-normal text-slate-500"> / mo</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Managed Vector DB</span>
                  <div className="text-xl font-bold text-slate-400 mt-1 line-through">
                    ${c.managed_db_monthly_cost_usd}
                    <span className="text-xs font-normal text-slate-400"> / mo</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-700 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Disk Storage:</span>
                    <span className="font-semibold text-slate-900">{c.raw_storage_gb} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Savings:</span>
                    <span className="text-emerald-600 font-bold">${c.monthly_savings_usd}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono space-y-1">
              <div>• Compute VM: {c.chromadb_breakdown.compute_vm}</div>
              <div>• Storage: {c.chromadb_breakdown.ebs_storage}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Model Assumptions & Cost Calculation Method
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-blue-600 flex items-center gap-1">
              <HardDrive className="w-4 h-4" /> ChromaDB Self-Hosted Model
            </h4>
            <ul className="space-y-1 list-disc list-inside text-slate-600 leading-relaxed font-mono">
              <li>Vector Dimension: {assumptions.embedding_dimension || 384}d float32</li>
              <li>HNSW Graph Index Overhead: {assumptions.hnsw_index_overhead_multiplier}x</li>
              <li>AWS EBS gp3 Disk Pricing: ${assumptions.ebs_gp3_price_per_gb_month}/GB-month</li>
              <li>EC2 Single Node Compute: $15/mo (100K), $30/mo (1M), $120/mo (10M)</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-purple-600 flex items-center gap-1">
              <Database className="w-4 h-4" /> Cloud Managed DB Baseline
            </h4>
            <ul className="space-y-1 list-disc list-inside text-slate-600 leading-relaxed font-mono">
              <li>Managed Storage Tier: ${assumptions.managed_storage_price_per_gb_month}/GB-month</li>
              <li>Vector Unit Fee: ${assumptions.managed_vector_price_per_million}/M vectors</li>
              <li>Read Query Units: {assumptions.monthly_query_volume_assumed}</li>
              <li>Tiered monthly base fee for query throughput</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
