import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  DollarSign, 
  Settings, 
  Zap, 
  Menu, 
  X 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemStatus }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'chat', label: 'Ask / Chat', icon: MessageSquare },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart3 },
    { id: 'cost', label: 'Cost Analysis', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-5 space-y-8 h-full overflow-y-auto shrink-0 custom-scrollbar">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-none">Cost-Efficient</h1>
            <p className="text-xs font-semibold text-blue-600 mt-1">RAG Architecture</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </aside>

      <header className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base">Cost-Efficient RAG</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:text-slate-900"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 shrink-0 z-40 shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm ${
                  isActive ? 'bg-blue-50 text-blue-600 border border-blue-200 font-semibold' : 'text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
