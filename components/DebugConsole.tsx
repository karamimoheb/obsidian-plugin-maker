
import React, { useState } from 'react';
import { X, Bug, Plus, Terminal, Trash2, CheckCircle, AlertTriangle, Clock, Activity, Loader2, Search, Zap } from 'lucide-react';
import { ProjectIssue } from '../types';

interface DebugConsoleProps {
  issues: ProjectIssue[];
  onClose: () => void;
  onAddIssue: (log: string) => void;
  onUpdateStatus: (id: string, status: ProjectIssue['status']) => void;
  onDeleteIssue: (id: string) => void;
  isProcessing?: boolean;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ 
  issues, 
  onClose, 
  onAddIssue, 
  onUpdateStatus, 
  onDeleteIssue,
  isProcessing 
}) => {
  const [newLog, setNewLog] = useState('');

  const handleAdd = () => {
    if (newLog.trim()) {
      onAddIssue(newLog.trim());
      setNewLog('');
    }
  };

  const getStatusIcon = (status: ProjectIssue['status']) => {
    switch (status) {
      case 'analyzing': return <Loader2 size={14} className="animate-spin text-blue-500" />;
      case 'researching': return <Search size={14} className="animate-pulse text-purple-500" />;
      case 'fixing': return <Zap size={14} className="animate-bounce text-amber-500" />;
      case 'resolved': return <CheckCircle size={14} className="text-green-500" />;
      default: return <AlertTriangle size={14} className="text-red-500" />;
    }
  };

  const getStatusLabel = (status: ProjectIssue['status']) => {
    switch (status) {
      case 'analyzing': return 'Analyzing Root Cause...';
      case 'researching': return 'Researching Modern Fixes...';
      case 'fixing': return 'Applying Code Correction...';
      case 'resolved': return 'Resolved';
      default: return 'Open';
    }
  };

  const openIssuesCount = issues.filter(i => i.status !== 'resolved').length;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in slide-in-from-bottom-10 duration-300">
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${openIssuesCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <Bug className={openIssuesCount > 0 ? 'text-red-500' : 'text-green-500'} size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl text-white">Intelligent Debug Center</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">
                {openIssuesCount} Active Errors
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* New Error Input */}
          <section className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-red-500/10 transition-all duration-700" />
            
            <h3 className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus size={14} /> Intelligence Pipeline: Fix Immediate Error
            </h3>
            <div className="space-y-3 relative z-10">
              <textarea 
                value={newLog}
                onChange={(e) => setNewLog(e.target.value)}
                placeholder="Paste Obsidian console logs or error messages here..."
                disabled={isProcessing}
                className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs font-mono focus:border-red-500/50 outline-none transition-all text-red-200 min-h-[120px] custom-scrollbar placeholder:text-zinc-700"
              />
              <button 
                onClick={handleAdd}
                disabled={!newLog.trim() || isProcessing}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-red-900/20"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Terminal size={18} />}
                <span>{isProcessing ? "Architect is fixing..." : "Analyze & Fix Issue"}</span>
              </button>
            </div>
          </section>

          {/* Issues List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Incident Response</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                <Activity size={12} className="text-blue-500 animate-pulse" />
                <span className="text-[9px] font-bold text-zinc-400">Live Diagnostics</span>
              </div>
            </div>

            {issues.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-zinc-800/50 rounded-3xl opacity-30">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
                <p className="text-sm text-zinc-500 font-medium">No system errors detected.</p>
                <p className="text-[10px] uppercase tracking-widest mt-2">Workspace is optimal</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...issues].sort((a, b) => b.timestamp - a.timestamp).map((issue) => (
                  <div 
                    key={issue.id} 
                    className={`group bg-zinc-900/40 border p-5 rounded-2xl transition-all ${
                      issue.status === 'resolved' ? 'border-green-500/20 opacity-60' : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg flex items-center gap-2 ${
                            issue.status === 'resolved' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {getStatusIcon(issue.status)}
                            {getStatusLabel(issue.status)}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-mono">
                            {new Date(issue.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="relative group/log">
                          <pre className="text-[11px] font-mono bg-black p-4 rounded-xl overflow-x-auto text-zinc-400 custom-scrollbar border border-zinc-800/50">
                            {issue.errorLog}
                          </pre>
                        </div>

                        {issue.analysis && (
                          <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Search size={12} /> Architect Analysis
                            </h4>
                            <p className="text-[12px] text-zinc-300 leading-relaxed italic">
                              "{issue.analysis}"
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {issue.status !== 'resolved' && (
                          <button 
                            onClick={() => onUpdateStatus(issue.id, 'resolved')}
                            className="p-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all shadow-lg shadow-green-900/20"
                            title="Mark as Resolved"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => onDeleteIssue(issue.id)}
                          className="p-2.5 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all text-[11px] uppercase tracking-wider"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugConsole;
