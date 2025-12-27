
import React, { useState } from 'react';
import { X, Bug, Plus, Terminal, Trash2, CheckCircle, AlertTriangle, Clock, Activity } from 'lucide-react';
import { ProjectIssue } from '../types';

interface DebugConsoleProps {
  issues: ProjectIssue[];
  onClose: () => void;
  onAddIssue: (log: string) => void;
  onUpdateStatus: (id: string, status: ProjectIssue['status']) => void;
  onDeleteIssue: (id: string) => void;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ issues, onClose, onAddIssue, onUpdateStatus, onDeleteIssue }) => {
  const [newLog, setNewLog] = useState('');

  const handleAdd = () => {
    if (newLog.trim()) {
      onAddIssue(newLog.trim());
      setNewLog('');
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
              <h2 className="font-bold text-xl text-white font-vazir">مرکز مدیریت خطا</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">
                {openIssuesCount} Active Issues Found
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
          <section className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10">
            <h3 className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest mb-4 font-vazir flex items-center gap-2">
              <Plus size={14} /> ثبت خطای جدید کنسول
            </h3>
            <div className="space-y-3">
              <textarea 
                value={newLog}
                onChange={(e) => setNewLog(e.target.value)}
                placeholder="خطا یا لاگ کنسول ابسیدین را اینجا پیست کنید..."
                className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs font-mono focus:border-red-500/50 outline-none transition-all text-red-200 min-h-[100px] custom-scrollbar"
              />
              <button 
                onClick={handleAdd}
                disabled={!newLog.trim()}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Terminal size={18} /> <span className="font-vazir">گزارش خطا به معمار</span>
              </button>
            </div>
          </section>

          {/* Issues List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-vazir">تاریخچه و وضعیت خطاها</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                <Activity size={12} className="text-blue-500 animate-pulse" />
                <span className="text-[9px] font-bold text-zinc-400">In-Project Debugging</span>
              </div>
            </div>

            {issues.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-3xl opacity-30">
                <CheckCircle size={40} className="mx-auto mb-3 text-green-600" />
                <p className="text-sm font-vazir text-zinc-500">هیچ خطایی گزارش نشده است. پروژه پایدار است!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...issues].sort((a, b) => b.timestamp - a.timestamp).map((issue) => (
                  <div 
                    key={issue.id} 
                    className={`group bg-zinc-900 border p-4 rounded-2xl transition-all ${
                      issue.status === 'open' ? 'border-red-500/20' : 
                      issue.status === 'fixing' ? 'border-amber-500/20' : 'border-green-500/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                            issue.status === 'open' ? 'bg-red-500/10 text-red-500' : 
                            issue.status === 'fixing' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                          }`}>
                            {issue.status === 'open' ? <AlertTriangle size={10} /> : issue.status === 'fixing' ? <Clock size={10} /> : <CheckCircle size={10} />}
                            {issue.status}
                          </span>
                          <span className="text-[9px] text-zinc-600 font-mono">
                            {new Date(issue.timestamp).toLocaleTimeString('fa-IR')}
                          </span>
                        </div>
                        <pre className="text-[10px] font-mono bg-black/50 p-3 rounded-lg overflow-x-auto text-zinc-400 custom-scrollbar border border-zinc-800">
                          {issue.errorLog}
                        </pre>
                      </div>
                      
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {issue.status !== 'resolved' && (
                          <button 
                            onClick={() => onUpdateStatus(issue.id, 'resolved')}
                            className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all"
                            title="رفع شده"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => onDeleteIssue(issue.id)}
                          className="p-2 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 size={14} />
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
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all text-xs font-vazir"
          >
            بستن کنسول
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugConsole;
