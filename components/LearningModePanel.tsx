
import React from 'react';
import { 
  BrainCircuit, X, Play, Pause, CheckCircle2, Circle, 
  Loader2, Sparkles, FileText, Download, AlertCircle, 
  CheckCircle, ArrowRight 
} from 'lucide-react';
import { LearningSession, LearningStep } from '../types';

interface LearningModePanelProps {
  session: LearningSession;
  onClose: () => void;
  onStart: () => void;
  onPauseToggle: () => void;
  isProcessing: boolean;
  onDownloadNotes: () => void;
  onDownloadRules: () => void;
}

const LearningModePanel: React.FC<LearningModePanelProps> = ({ 
  session, 
  onClose, 
  onStart, 
  onPauseToggle, 
  isProcessing,
  onDownloadNotes,
  onDownloadRules
}) => {
  const getStepIcon = (step: LearningStep) => {
    if (step.status === 'completed') return <CheckCircle2 size={20} className="text-green-500" />;
    if (step.status === 'active') return <Loader2 size={20} className="text-blue-500 animate-spin" />;
    if (step.status === 'error') return <AlertCircle size={20} className="text-red-500" />;
    return <Circle size={20} className="text-zinc-700" />;
  };

  const completedCount = session.steps.filter(s => s.status === 'completed').length;
  const progress = (completedCount / session.steps.length) * 100;
  const isFinished = completedCount === session.steps.length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] relative">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-zinc-800/50 bg-zinc-900/20 z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-500/10 rounded-3xl relative">
              <BrainCircuit className="text-blue-500" size={28} />
              {session.isActive && !session.isPaused && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-2xl text-white tracking-tight">Intelligence Extraction</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mt-1">Deep Codegrounded Learning Mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white group">
            <X size={24} className="group-active:scale-90 transition-transform" />
          </button>
        </div>

        {/* Main Progress Indicator */}
        <div className="px-8 pt-8 pb-4 z-10">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Extraction Velocity</span>
              <span className="text-3xl font-mono font-bold text-white">{Math.round(progress)}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Status</span>
              <span className={`text-xs font-bold ${isFinished ? 'text-green-500' : 'text-blue-500'} uppercase tracking-tighter`}>
                {isFinished ? 'Sequence Complete' : (session.isActive ? (session.isPaused ? 'Paused' : 'Analyzing...') : 'Idle')}
              </span>
            </div>
          </div>
          <div className="w-full bg-zinc-900/50 h-3 rounded-full overflow-hidden border border-zinc-800/50 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        {/* Steps Scroller */}
        <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar z-10">
          {session.steps.map((step, idx) => (
            <div 
              key={step.id} 
              className={`group p-5 rounded-3xl border transition-all duration-500 ${
                step.status === 'active' 
                  ? 'bg-blue-600/10 border-blue-500/40 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20' 
                  : step.status === 'completed'
                  ? 'bg-zinc-900/30 border-green-500/20 opacity-90'
                  : 'bg-zinc-900/10 border-zinc-800 opacity-40 hover:opacity-60 transition-opacity'
              }`}
            >
              <div className="flex items-start gap-5">
                <div className={`mt-1 flex-shrink-0 transition-transform duration-300 ${step.status === 'active' ? 'scale-110' : ''}`}>
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-sm font-bold tracking-tight ${step.status === 'active' ? 'text-blue-400' : 'text-zinc-100'}`}>
                      Step {idx + 1}: {step.title}
                    </h3>
                    {step.status === 'completed' && <span className="text-[9px] font-black uppercase text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Passed</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {step.status === 'active' && isProcessing && (
                    <div className="mt-5 p-4 bg-black/40 rounded-[1.25rem] border border-blue-500/20 flex items-center gap-4 animate-in fade-in zoom-in-95">
                      <div className="relative h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </div>
                      <span className="text-[11px] text-blue-400 font-bold uppercase tracking-[0.1em] animate-pulse">Architect is parsing repository logic...</span>
                    </div>
                  )}

                  {step.result && (
                    <div className="mt-5 p-4 bg-zinc-950/80 rounded-[1.25rem] border border-zinc-800 text-[11px] font-mono text-zinc-400 max-h-40 overflow-y-auto custom-scrollbar leading-relaxed">
                      <div className="flex items-center gap-2 mb-2 text-zinc-500 border-b border-zinc-800 pb-2">
                         <Sparkles size={12} className="text-amber-500" />
                         <span>Technical Insights</span>
                      </div>
                      <div className="whitespace-pre-wrap">{step.result}</div>
                    </div>
                  )}

                  {step.status === 'error' && (
                    <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-[11px] text-red-400 font-medium">
                      {step.errorMessage || "Extraction failed for this sequence."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Outputs Section */}
          {isFinished && (
            <div className="mt-8 p-8 bg-green-500/5 border border-green-500/20 rounded-[2.5rem] animate-in zoom-in-95 duration-700">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="p-4 bg-green-500/20 rounded-full mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h4 className="text-lg font-bold text-white">Knowledge Extracted Successfully</h4>
                <p className="text-xs text-zinc-500 mt-2 max-w-sm">The architect has decoded the plugin structure and generated reusable knowledge artifacts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={onDownloadNotes}
                  className="flex items-center justify-between p-5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-3xl transition-all group active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                      <FileText size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Learning Notes</div>
                      <div className="text-[10px] text-zinc-500">LEARNING_NOTES.md</div>
                    </div>
                  </div>
                  <Download size={18} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
                </button>

                <button 
                  onClick={onDownloadRules}
                  className="flex items-center justify-between p-5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-3xl transition-all group active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                      <Sparkles size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Plugin Rules</div>
                      <div className="text-[10px] text-zinc-500">PLUGIN_RULES.md</div>
                    </div>
                  </div>
                  <Download size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-8 border-t border-zinc-800/50 bg-zinc-900/40 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {!session.isActive && !isFinished && (
              <button 
                onClick={onStart}
                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-[1.25rem] font-bold transition-all text-sm flex items-center gap-3 shadow-2xl shadow-blue-500/20 active:scale-95 hover:-translate-y-0.5"
              >
                <Play size={18} fill="currentColor" /> Start Full Review
              </button>
            )}
            {session.isActive && !isFinished && (
              <button 
                onClick={onPauseToggle}
                className={`px-10 py-4 rounded-[1.25rem] font-bold transition-all text-sm flex items-center gap-3 active:scale-95 ${
                  session.isPaused 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {session.isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                {session.isPaused ? 'Resume Sequence' : 'Pause Analysis'}
              </button>
            )}
            {isFinished && (
               <button 
                 onClick={onClose}
                 className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-10 py-4 rounded-[1.25rem] font-bold transition-all text-sm flex items-center gap-3 active:scale-95"
               >
                 Sequence Terminated
               </button>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest"
          >
            {isFinished ? 'Dismiss' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningModePanel;
