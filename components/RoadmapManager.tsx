
import React from 'react';
import { X, CheckCircle2, Circle, Lightbulb, Play, ClipboardList, ArrowRight, Zap } from 'lucide-react';
import { ProjectTask } from '../types';

interface RoadmapManagerProps {
  tasks: ProjectTask[];
  onClose: () => void;
  onExecuteTask: (taskTitle: string) => void;
}

const RoadmapManager: React.FC<RoadmapManagerProps> = ({ tasks, onClose, onExecuteTask }) => {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const suggestions = tasks.filter(t => t.status === 'suggestion');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <ClipboardList className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl text-white">Project Roadmap</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Project Scope & Smart Suggestions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-center shadow-lg shadow-blue-500/5">
              <div className="text-2xl font-bold text-blue-500 font-mono">{completedTasks.length}</div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mt-1">Done</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-center shadow-lg shadow-amber-500/5">
              <div className="text-2xl font-bold text-amber-500 font-mono">{todoTasks.length}</div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mt-1">Pending</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-center shadow-lg shadow-purple-500/5">
              <div className="text-2xl font-bold text-purple-500 font-mono">{suggestions.length}</div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mt-1">Ideas</div>
            </div>
          </div>

          {/* Pending Tasks */}
          {todoTasks.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Circle size={14} /> Pending Tasks (Todo)
              </h3>
              <div className="space-y-3">
                {todoTasks.map(task => (
                  <div key={task.id} className="group bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex items-center justify-between hover:bg-amber-500/10 transition-all">
                    <div className="flex items-center gap-3">
                      <Circle className="text-amber-500/50 flex-shrink-0" size={16} />
                      <div>
                        <div className="text-zinc-200 text-sm font-bold">{task.title}</div>
                        {task.description && <div className="text-[10px] text-zinc-500 mt-0.5">{task.description}</div>}
                      </div>
                    </div>
                    <button 
                      onClick={() => onExecuteTask(`Please complete this pending task: ${task.title}`)}
                      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                    >
                      <Play size={12} fill="currentColor" /> <span>Execute</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Smart Suggestions */}
          {suggestions.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Lightbulb size={14} /> AI Suggestions
              </h3>
              <div className="space-y-3">
                {suggestions.map(task => (
                  <div key={task.id} className="group bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl flex items-center justify-between hover:bg-purple-500/10 transition-all">
                    <div className="flex items-center gap-3">
                      <Zap className="text-purple-500 flex-shrink-0" size={16} />
                      <div>
                        <div className="text-zinc-200 text-sm font-bold">{task.title}</div>
                        {task.description && <div className="text-[10px] text-zinc-500 mt-0.5">{task.description}</div>}
                      </div>
                    </div>
                    <button 
                      onClick={() => onExecuteTask(`Please implement this suggested feature: ${task.title}`)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                    >
                      <Play size={12} fill="currentColor" /> <span>Execute</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed Tasks */}
          <section>
            <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 size={14} /> Completed Tasks
            </h3>
            <div className="space-y-2 opacity-60">
              {completedTasks.map(task => (
                <div key={task.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="text-green-500 flex-shrink-0" size={16} />
                  <span className="text-zinc-400 text-xs line-through">{task.title}</span>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <div className="text-center py-6 text-zinc-600 text-xs italic">No tasks completed yet.</div>
              )}
            </div>
          </section>

        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all text-xs"
          >
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapManager;
