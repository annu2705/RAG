import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import DocumentsView from './components/DocumentsView';
import AskChatView from './components/AskChatView';
import EvaluationView from './components/EvaluationView';
import CostAnalysisView from './components/CostAnalysisView';
import SettingsView from './components/SettingsView';
import { getStats } from './apiClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    getStats()
      .then(res => setSystemStatus(res.data))
      .catch(console.error);
  }, [activeTab]);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        systemStatus={systemStatus} 
      />

      <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-y-auto custom-scrollbar">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'documents' && <DocumentsView />}
        {activeTab === 'chat' && <AskChatView />}
        {activeTab === 'evaluation' && <EvaluationView />}
        {activeTab === 'cost' && <CostAnalysisView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
