
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck, Cpu, Globe, Zap, Settings2 } from 'lucide-react';
import { AIModelConfig } from '../types';

interface ModelManagerProps {
  models: AIModelConfig[];
  onClose: () => void;
  onUpdate: (models: AIModelConfig[]) => void;
}

type ProviderType = 'gemini' | 'openrouter' | 'custom';

const ModelManager: React.FC<ModelManagerProps> = ({ models, onClose, onUpdate }) => {
  const [activeProvider, setActiveProvider] = useState<ProviderType>('gemini');
  const [newModel, setNewModel] = useState<Partial<AIModelConfig>>({
    name: '',
    baseUrl: '',
    apiKey: '',
    modelName: ''
  });

  const handleProviderChange = (provider: ProviderType) => {
    setActiveProvider(provider);
    if (provider === 'gemini') {
      setNewModel({
        name: 'Gemini 2.5 Flash',
        baseUrl: 'https://generativelanguage.googleapis.com',
        modelName: 'gemini-3-flash-preview',
        apiKey: ''
      });
    } else if (provider === 'openrouter') {
      setNewModel({
        name: 'OpenRouter Claude',
        baseUrl: 'https://openrouter.ai/api/v1',
        modelName: 'anthropic/claude-3.5-sonnet',
        apiKey: ''
      });
    } else {
      setNewModel({ name: '', baseUrl: '', apiKey: '', modelName: '' });
    }
  };

  // Fix: Initialize defaults correctly using useEffect
  useEffect(() => {
    handleProviderChange('gemini');
  }, []);

  const handleAdd = () => {
    if (newModel.name && newModel.apiKey) {
      const model: AIModelConfig = {
        id: Math.random().toString(36).substring(2, 11), // Simple ID generator if crypto is restricted
        name: newModel.name!,
        baseUrl: newModel.baseUrl || '',
        apiKey: newModel.apiKey!,
        modelName: newModel.modelName || 'default',
        provider: activeProvider
      };
      onUpdate([...models, model]);
      // Keep provider but clear sensitive data
      setNewModel(prev => ({ ...prev, apiKey: '' }));
    }
  };

  const handleDelete = (id: string) => {
    onUpdate(models.filter(m => m.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShieldCheck className="text-blue-500" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Manage Inference Providers</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Configure AI models for your architect</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar Navigation */}
          <div className="w-56 border-r border-zinc-800 p-4 space-y-2 hidden sm:flex flex-col bg-zinc-900/30">
            <button 
              onClick={() => handleProviderChange('gemini')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeProvider === 'gemini' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
            >
              <Zap size={14} /> Gemini (Google)
            </button>
            <button 
              onClick={() => handleProviderChange('openrouter')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeProvider === 'openrouter' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
            >
              <Globe size={14} /> OpenRouter
            </button>
            <button 
              onClick={() => handleProviderChange('custom')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeProvider === 'custom' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
            >
              <Settings2 size={14} /> Custom API
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-zinc-950/20">
            {/* Mobile Provider Switcher */}
            <div className="flex sm:hidden gap-2 mb-6 bg-zinc-900 p-1 rounded-xl">
              {(['gemini', 'openrouter', 'custom'] as ProviderType[]).map(p => (
                <button 
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider ${activeProvider === p ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  Add New {activeProvider} Model
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 px-1 uppercase tracking-wider">Model Label</label>
                    <input 
                      placeholder="e.g. Architect Pro v1"
                      className="w-full bg-zinc-900/50 border border-zinc-700/50 p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all text-white placeholder:text-zinc-600"
                      value={newModel.name}
                      onChange={e => setNewModel({...newModel, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 px-1 uppercase tracking-wider">Model ID / Name</label>
                    <input 
                      placeholder="e.g. gemini-3-flash-preview"
                      className="w-full bg-zinc-900/50 border border-zinc-700/50 p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all text-white placeholder:text-zinc-600"
                      value={newModel.modelName}
                      onChange={e => setNewModel({...newModel, modelName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 px-1 uppercase tracking-wider">API Key</label>
                    <input 
                      type="password"
                      placeholder={`Enter your ${activeProvider} API key securely`}
                      className="w-full bg-zinc-900/50 border border-zinc-700/50 p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all text-white placeholder:text-zinc-600"
                      value={newModel.apiKey}
                      onChange={e => setNewModel({...newModel, apiKey: e.target.value})}
                    />
                  </div>
                  {activeProvider === 'custom' && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-500 px-1 uppercase tracking-wider">Base URL</label>
                      <input 
                        placeholder="e.g. https://api.openai.com/v1"
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all text-white placeholder:text-zinc-600"
                        value={newModel.baseUrl}
                        onChange={e => setNewModel({...newModel, baseUrl: e.target.value})}
                      />
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handleAdd}
                  disabled={!newModel.name || !newModel.apiKey}
                  className="mt-8 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all w-full justify-center shadow-xl shadow-blue-600/10 active:scale-[0.98]"
                >
                  <Plus size={18} /> Register Inference Model
                </button>
              </section>

              <section className="pt-8 border-t border-zinc-800/80">
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Configured Models</h3>
                {models.length === 0 ? (
                  <div className="p-12 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-30">
                    <Cpu size={40} className="mb-3 text-zinc-500" />
                    <p className="text-sm font-medium">No active models. Add one to enable Architect.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {models.map(model => (
                      <div key={model.id} className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            model.provider === 'gemini' ? 'bg-amber-500/10 text-amber-500' :
                            model.provider === 'openrouter' ? 'bg-purple-500/10 text-purple-500' :
                            'bg-zinc-500/10 text-zinc-500'
                          }`}>
                            {model.provider === 'gemini' ? <Zap size={18} /> : 
                             model.provider === 'openrouter' ? <Globe size={18} /> : <Cpu size={18} />}
                          </div>
                          <div>
                            <div className="font-bold text-base text-zinc-100">{model.name}</div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-2 font-mono mt-1">
                              <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 uppercase tracking-tighter">{model.provider || 'custom'}</span>
                              <span className="opacity-60">{model.modelName}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(model.id)}
                          className="text-zinc-600 hover:text-red-500 p-2.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-xl"
                          title="Remove Model"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/40 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all text-xs active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="bg-white hover:bg-zinc-100 text-black px-10 py-3 rounded-xl font-bold transition-all text-xs shadow-lg shadow-white/5 active:scale-95"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelManager;
