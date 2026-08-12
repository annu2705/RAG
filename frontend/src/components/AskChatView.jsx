import React, { useState } from 'react';
import { queryRAG } from '../apiClient';
import { 
  Send, MessageSquare, Clock, Zap, ChevronDown, ChevronUp, 
  FileText, ShieldCheck, Cpu, AlertTriangle, Layers, BookOpen 
} from 'lucide-react';

export default function AskChatView() {
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(4);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [showChunks, setShowChunks] = useState(true);

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await queryRAG({
        question: question.trim(),
        top_k: parseInt(topK) || 4
      });
      setResponse(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What is the recommended chunk size and overlap for document chunking?",
    "How does idempotent re-ingestion prevent duplicate vectors?",
    "What is the p95 latency for 100K vectors on 4-vCPU instances?",
    "What is Quantum Teleportation Superluminal Bandwidth Limit?"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Grounded RAG Query & Chat</h2>
        <p className="text-sm text-slate-500 mt-1">Ask questions grounded strictly in uploaded document context with verifiable chunk citations</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
        <form onSubmit={handleAsk} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about uploaded documents..."
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 pr-24"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 text-sm shadow-xs"
              >
                {loading ? <Zap className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Ask</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-slate-600">Top-K:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
                className="bg-transparent text-xs text-blue-600 font-bold font-mono focus:outline-none cursor-pointer"
              >
                <option value="2" className="bg-white text-slate-800">K=2</option>
                <option value="4" className="bg-white text-slate-800">K=4</option>
                <option value="6" className="bg-white text-slate-800">K=6</option>
                <option value="10" className="bg-white text-slate-800">K=10</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Sample Questions:</span>
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuestion(sq)}
                className="text-xs bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 px-3 py-1 rounded-full transition-colors truncate max-w-xs"
              >
                {sq}
              </button>
            ))}
          </div>
        </form>
      </div>

      {loading && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <Zap className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Searching ChromaDB vector index & generating grounded response...</p>
          <p className="text-xs text-slate-500 font-mono">Running top-K similarity search and strict context verification</p>
        </div>
      )}

      {error && (
        <div className="glass-panel p-5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="space-y-6">
          <div className={`glass-panel p-6 rounded-2xl border ${
            response.is_safe_response ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
          } space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800">Answer</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-emerald-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Retrieval: {response.retrieval_latency_ms} ms
                </span>
                <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-blue-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Total: {response.total_latency_ms} ms
                </span>
                <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-purple-700 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> Tokens: {response.token_usage.total_tokens}
                </span>
              </div>
            </div>

            <div className="text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {response.answer}
            </div>

            {response.is_safe_response && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Safe Response Triggered: Answer is not supported by retrieved document context. Hallucination avoided.</span>
              </div>
            )}

            {response.citations && response.citations.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Document Citations
                </span>
                <div className="flex flex-wrap gap-2">
                  {response.citations.map((c, idx) => (
                    <span key={idx} className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-mono flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-semibold">{c.document_name}</span>
                      {c.page_number && <span className="text-slate-500">(Page {c.page_number})</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowChunks(!showChunks)}
              className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left border-b border-slate-200"
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-slate-800 text-sm">
                  Retrieved Context Chunks ({response.retrieved_chunks.length})
                </span>
              </div>
              {showChunks ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
            </button>

            {showChunks && (
              <div className="p-5 space-y-4 divide-y divide-slate-100">
                {response.retrieved_chunks.map((chunk, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded font-bold">
                          Chunk #{idx + 1}
                        </span>
                        <span className="text-slate-900 font-semibold">{chunk.document_name}</span>
                        {chunk.page_number && <span className="text-slate-500">(Page {chunk.page_number})</span>}
                      </div>
                      <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Similarity: {(chunk.similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-slate-800 leading-relaxed text-xs">
                      {chunk.chunk_text}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      ID: {chunk.chunk_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
