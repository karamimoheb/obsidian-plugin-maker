
import React, { useState } from 'react';
import { X, History, Save, RotateCcw, Trash2, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { ProjectSnapshot } from '../types';

interface SnapshotManagerProps {
  snapshots: ProjectSnapshot[];
  onClose: () => void;
  onRestore: (snapshot: ProjectSnapshot) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}

const SnapshotManager: React.FC<SnapshotManagerProps> = ({ snapshots, onClose, onRestore, onSave, onDelete }) => {
  const [newSnapshotName, setNewSnapshotName] = useState('');

  const handleSave = () => {
    onSave(newSnapshotName.trim() || `Version ${new Date().toLocaleTimeString()}`);
    setNewSnapshotName('');
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <History className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl text-white">Project History</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Manage Project Versions & Snapshots</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Create New Snapshot */}
          <section className="bg-zinc-800/30 p-4 rounded-2xl border border-zinc-800">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Create New Snapshot</h3>
            <div className="flex gap-3">
              <input 
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                placeholder="Snapshot Name (e.g. Before Styling Changes)"
                className="flex-1 bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-blue-500 outline-none transition-all text-white"
              />
              <button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
              >
                <Save size={18} /> <span>Save Snapshot</span>
              </button>
            </div>
          </section>

          {/* Snapshot List */}
          <section>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Saved Versions</h3>
            {snapshots.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-3xl opacity-40">
                <Clock size={40} className="mx-auto mb-3 text-zinc-600" />
                <p className="text-sm text-zinc-500">No snapshots found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...snapshots].sort((a, b) => b.timestamp - a.timestamp).map((snap) => (
                  <div key={snap.id} className="group bg-zinc-800/20 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between hover:bg-zinc-800/40 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-zinc-800 rounded-xl text-zinc-500">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-100 text-sm">{snap.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Calendar size={10} /> {formatDate(snap.timestamp)}
                          </span>
                          <span className="text-[10px] text-blue-500 font-mono bg-blue-500/10 px-1.5 rounded">
                            {snap.files.length} Files
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onRestore(snap)}
                        className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/10 active:scale-90"
                        title="Restore this version"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(snap.id)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all active:scale-90"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
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
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all text-xs"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnapshotManager;
