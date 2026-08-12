import React, { useState, useEffect } from 'react';
import { getConfig } from '../apiClient';
import { Settings, ShieldAlert, Cpu, Database } from 'lucide-react';

export default function SettingsView() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig()
      .then(res => setConfig(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        <Settings className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        Loading system configuration...
      </div>
    );
  }

  const comparisonData = [
    { db: 'ChromaDB', verdict: 'Selected', desc: 'Zero-config local persistence, native python binding, fast HNSW cosine search without requiring separate database processes.' },
    { db: 'pgvector', verdict: 'Alternative', desc: 'Excellent for existing PostgreSQL deployments, but higher operational complexity and connection overhead for pure AI microservices.' },
    { db: 'Qdrant', verdict: 'Alternative', desc: 'High performance Rust vector engine, but requires running a separate Docker service daemon.' },
    { db: 'LanceDB', verdict: 'Alternative', desc: 'Parquet-based vector DB, ideal for multi-modal datasets, but higher disk I/O latency for frequent small updates.' },
    { db: 'FAISS', verdict: 'Alternative', desc: 'Ultra-fast in-memory similarity search library, but lacks native metadata CRUD and database persistence.' },
    { db: 'sqlite-vec', verdict: 'Alternative', desc: 'Minimalist SQLite vector extension, but early stage ecosystem with limited HNSW indexing optimization.' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration & Architecture</h2>
        <p className="text-sm text-slate-500 mt-1">Non-secret runtime settings and vector database selection rationale</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-5">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            Active Pipeline Configuration
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Vector Database</span>
              <span className="text-blue-600 font-bold">{config?.vector_store}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Embedding Model</span>
              <span className="text-slate-900">{config?.embedding_model}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Embedding Dimension</span>
              <span className="text-purple-600 font-bold">{config?.embedding_dimension} dimensions</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Default Chunk Size</span>
              <span className="text-slate-900">{config?.default_chunk_size} chars</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Default Chunk Overlap</span>
              <span className="text-slate-900">{config?.default_chunk_overlap} chars</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Default Top-K Retrieval</span>
              <span className="text-emerald-600 font-bold">{config?.default_top_k} chunks</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-sans">Generator Model</span>
              <span className="text-indigo-600 font-bold">{config?.generator_model}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Security & Credentials Policy
          </h3>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-sans">
            <p>
              • All API keys (e.g. Gemini, OpenAI) and sensitive settings are strictly stored in system environment variables (<code className="text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">.env</code>).
            </p>
            <p>
              • Neither raw API keys nor secrets are ever exposed via client-side endpoints or frontend UI components.
            </p>
            <p>
              • <code className="text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">.env</code> is explicitly ignored by version control (<code className="text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">.gitignore</code>) and sanitized template variables are provided in <code className="text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">.env.example</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-600" />
          Why ChromaDB? Architectural Selection Rationale
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {comparisonData.map((item, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${
              item.verdict === 'Selected' ? 'bg-blue-50/70 border-blue-200' : 'bg-slate-50 border-slate-200'
            } space-y-1.5`}>
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-900 text-sm">{item.db}</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  item.verdict === 'Selected' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {item.verdict}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed font-sans">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
