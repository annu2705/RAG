import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = () => api.get('/health');
export const getConfig = () => api.get('/config');
export const getStats = () => api.get('/stats');
export const getDocuments = () => api.get('/documents');
export const ingestDocument = (formData, config = {}) => api.post('/documents/ingest', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  ...config,
});
export const deleteDocument = (documentId) => api.delete(`/documents/${documentId}`);
export const queryRAG = (data) => api.post('/query', data);
export const runEvaluation = () => api.post('/evaluation/run');
export const getEvaluationResults = () => api.get('/evaluation/results');
export const getCostAnalysis = () => api.get('/cost-analysis');
export const getRecentLogs = (limit = 50) => api.get(`/logs?limit=${limit}`);

export default api;
