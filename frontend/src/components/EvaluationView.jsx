import React, { useState, useEffect } from 'react';
import { runEvaluation, getEvaluationResults } from '../apiClient';
import { 
  BarChart3, Play, Activity, CheckCircle2, Clock, 
  Target, Award, ShieldCheck, Zap, AlertCircle 
} from 'lucide-react';

export default function EvaluationView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await getEvaluationResults();
      if (res.data.status === 'completed') {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleRunEvaluation = async () => {
    setRunning(true);
    setError(null);
    try {
      await runEvaluation();
      await fetchResults();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Evaluation run failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        <Activity className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        Checking evaluation status...
      </div>
    );
  }

  const summary = data?.summary;
  const retrieval = data?.retrieval;
  const latency = data?.latency;

  const metricCards = summary ? [
    { label: 'Recall@K (Hit Rate)', value: `${(summary.retrieval_metrics.recall_at_k * 100).toFixed(1)}%`, icon: Target, color: 'text-blue-600', border: 'border-blue-100' },
    { label: 'Mean Reciprocal Rank (MRR)', value: summary.retrieval_metrics.mrr.toFixed(3), icon: Award, color: 'text-teal-600', border: 'border-teal-100' },
    { label: 'nDCG@K', value: summary.retrieval_metrics.ndcg_at_k.toFixed(3), icon: BarChart3, color: 'text-purple-600', border: 'border-purple-100' },
    { label: 'Context Precision', value: summary.retrieval_metrics.context_precision.toFixed(3), icon: Activity, color: 'text-emerald-600', border: 'border-emerald-100' },
    { label: 'Faithfulness / Groundedness', value: `${(summary.answer_quality_metrics.faithfulness * 100).toFixed(1)}%`, icon: ShieldCheck, color: 'text-indigo-600', border: 'border-indigo-100' },
    { label: 'Answer Relevance', value: summary.answer_quality_metrics.answer_relevance.toFixed(3), icon: CheckCircle2, color: 'text-blue-600', border: 'border-blue-100' },
    { label: 'F1 Score', value: summary.answer_quality_metrics.f1_score.toFixed(3), icon: Award, color: 'text-pink-600', border: 'border-pink-100' },
    { label: 'Retrieval p50 / p95', value: `${latency?.retrieval_p50_ms || 0}ms / ${latency?.retrieval_p95_ms || 0}ms`, icon: Clock, color: 'text-amber-600', border: 'border-amber-100' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">RAG Evaluation Benchmark</h2>
          <p className="text-sm text-slate-500 mt-1">Calculated retrieval and generation quality metrics on 20 test questions</p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className="flex items-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all text-sm self-start sm:self-auto"
        >
          {running ? <Zap className="w-4 h-4 animate-spin text-white" /> : <Play className="w-4 h-4 text-white fill-current" />}
          <span>{running ? 'Running Benchmark...' : 'Run Evaluation Dataset'}</span>
        </button>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {!summary ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-800">No Evaluation Results Available</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Click "Run Evaluation Dataset" above to run the 20-question benchmark dataset through ChromaDB and calculate exact metrics.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metricCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className={`glass-panel p-5 rounded-2xl border ${card.border} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{card.value}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {retrieval?.per_question && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Per-Question Evaluation Detail ({retrieval.per_question.length} Questions)
              </h3>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 uppercase text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Question</th>
                      <th className="py-3 px-4">Hit</th>
                      <th className="py-3 px-4">MRR</th>
                      <th className="py-3 px-4">nDCG</th>
                      <th className="py-3 px-4">Context Prec.</th>
                      <th className="py-3 px-4">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {retrieval.per_question.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-500">{q.id}</td>
                        <td className="py-3 px-4 font-sans font-medium text-slate-900 truncate max-w-md">{q.question}</td>
                        <td className="py-3 px-4">
                          {q.hit ? (
                            <span className="text-emerald-600 font-bold">PASS</span>
                          ) : (
                            <span className="text-rose-600 font-bold">FAIL</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-blue-600 font-bold">{q.reciprocal_rank.toFixed(2)}</td>
                        <td className="py-3 px-4 text-purple-600 font-bold">{q.ndcg.toFixed(2)}</td>
                        <td className="py-3 px-4 text-teal-600 font-bold">{q.context_precision.toFixed(2)}</td>
                        <td className="py-3 px-4 text-amber-600 font-bold">{q.retrieval_latency_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
