import React, { useEffect, useState } from 'react';
import { getStats, getRecentLogs } from '../apiClient';
import { Files, Layers, Database, Cpu, Activity, Clock, CheckCircle2 } from 'lucide-react';

export default function DashboardView() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([getStats(), getRecentLogs(10)]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        <Activity className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        Loading system statistics...
      </div>
    );
  }

  const statCards = [
    { label: 'Total Documents', value: stats?.total_documents || 0, icon: Files, bg: 'bg-blue-50', border: 'border-blue-100', iconColor: 'text-blue-600' },
    { label: 'Total Chunks', value: stats?.total_chunks || 0, icon: Layers, bg: 'bg-teal-50', border: 'border-teal-100', iconColor: 'text-teal-600' },
    { label: 'Total Vectors', value: stats?.total_vectors || 0, icon: Database, bg: 'bg-purple-50', border: 'border-purple-100', iconColor: 'text-purple-600' },
    { label: 'Embedding Dimension', value: `${stats?.embedding_dimension || 384}d`, icon: Cpu, bg: 'bg-emerald-50', border: 'border-emerald-100', iconColor: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time vector store statistics and active RAG pipeline metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`glass-panel p-5 rounded-2xl border ${card.border} glass-panel-hover flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Pipeline Queries
            </h3>
            <span className="text-xs text-slate-500">{logs.length} logged queries</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No recent queries logged yet. Ask questions in the Ask/Chat tab!
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Question</th>
                    <th className="py-3 px-4">Top-K</th>
                    <th className="py-3 px-4">Retrieval Latency</th>
                    <th className="py-3 px-4">Chunks</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {logs.map((log, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 truncate max-w-xs">{log.question}</td>
                      <td className="py-3 px-4 text-blue-600 font-bold">{log.top_k}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{log.retrieval_latency_ms?.toFixed(1)} ms</td>
                      <td className="py-3 px-4 text-purple-600 font-bold">{log.retrieved_chunk_count}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> OK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Infrastructure Info
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Vector Store</span>
              <span className="font-semibold text-slate-900">{stats?.vector_store}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Embedding Model</span>
              <span className="font-semibold text-blue-600">{stats?.embedding_model}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Vector Dimension</span>
              <span className="font-semibold text-slate-900">{stats?.embedding_dimension} dimensions</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Distance Metric</span>
              <span className="font-semibold text-slate-900">Cosine Similarity</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">System Health</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
