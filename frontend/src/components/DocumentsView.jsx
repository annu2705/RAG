import React, { useState, useEffect, useRef } from 'react';
import { getDocuments, ingestDocument, deleteDocument } from '../apiClient';
import { 
  UploadCloud, FileText, Trash2, RefreshCw, Search, 
  CheckCircle, AlertCircle, Loader2, ShieldCheck, Layers 
} from 'lucide-react';

export default function DocumentsView() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await getDocuments();
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadStatus(null);

    const results = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chunk_size', chunkSize);
      formData.append('chunk_overlap', chunkOverlap);

      try {
        const res = await ingestDocument(formData);
        results.push(res.data);
      } catch (err) {
        console.error(err);
        setUploadStatus({
          type: 'error',
          message: err.response?.data?.detail || `Failed to ingest ${file.name}`
        });
      }
    }

    setUploading(false);
    if (results.length > 0) {
      const last = results[results.length - 1];
      if (last.is_reingest) {
        setUploadStatus({
          type: 'idempotent',
          message: `Document "${last.document_name}" re-ingested successfully! 0 new vectors created (Idempotent Hash Match).`
        });
      } else {
        setUploadStatus({
          type: 'success',
          message: `Successfully ingested ${results.length} document(s) into ChromaDB (${last.new_vectors_added} vectors added).`
        });
      }
      fetchDocs();
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document and all associated vectors?')) return;
    try {
      await deleteDocument(docId);
      fetchDocs();
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed');
    }
  };

  const handleReingest = async (docName) => {
    alert(`To test idempotent re-ingestion, select and upload the file "${docName}" again using the upload zone above!`);
  };

  const filteredDocs = documents.filter(d => 
    d.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.file_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Document Ingestion & Management</h2>
        <p className="text-sm text-slate-500 mt-1">Upload PDF, HTML, and Markdown files with configurable chunking and idempotent vector indexing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Document Upload
            </h3>
            <span className="text-xs text-slate-500 font-mono">PDF, HTML, MD, TXT</span>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.html,.htm,.md,.markdown,.txt"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-full bg-blue-100 text-blue-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Click to choose files or drag & drop here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports multiple files simultaneously
                </p>
              </div>
            </div>
          </div>

          {uploading && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-700 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing and vectorizing documents in ChromaDB...</span>
            </div>
          )}

          {uploadStatus && (
            <div className={`p-4 rounded-xl border flex items-start space-x-3 text-sm ${
              uploadStatus.type === 'idempotent'
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : uploadStatus.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              {uploadStatus.type === 'idempotent' ? (
                <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              ) : uploadStatus.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {uploadStatus.type === 'idempotent' ? 'Idempotent Re-Ingestion Verified' : uploadStatus.type === 'error' ? 'Ingestion Error' : 'Ingestion Completed'}
                </p>
                <p className="text-xs mt-1 leading-relaxed">{uploadStatus.message}</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Ingestion Parameters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chunk Size (characters)
              </label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value) || 500)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">Characters per chunk block</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chunk Overlap (characters)
              </label>
              <input
                type="number"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 50)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">Overlapping text boundary to preserve context</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Ingested Documents ({filteredDocs.length})
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500 text-sm">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No documents uploaded yet. Upload a PDF, HTML, or Markdown file above!
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Ingested At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredDocs.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate max-w-xs">{doc.document_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{(doc.file_size_bytes / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-4 text-purple-600 font-bold">{doc.chunk_count}</td>
                    <td className="py-3 px-4 text-slate-500 font-sans">{doc.ingestion_timestamp?.slice(0, 19).replace('T', ' ')}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleReingest(doc.document_name)}
                          title="Re-ingest Document (Idempotent test)"
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.document_id)}
                          title="Delete Document"
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
