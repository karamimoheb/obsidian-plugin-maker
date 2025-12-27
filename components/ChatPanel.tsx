
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, ChevronRight, Paperclip, X, 
  FileText, Sparkles, Cpu, Copy, Check, Eraser, Trash2, 
  RotateCcw, Square, Pencil, RefreshCw, Ban
} from 'lucide-react';
import { ChatMessage, ChatAttachment, AIModelConfig } from '../types';

interface ChatPanelProps {
  history: ChatMessage[];
  onSendMessage: (msg: string, attachments: ChatAttachment[]) => void;
  onClearMemory: () => void;
  onStopProcessing: () => void;
  isProcessing: boolean;
  selectedModelId: string;
  availableModels: AIModelConfig[];
  onModelChange: (modelId: string) => void;
  onToggleCollapse: () => void;
  onEditMessage: (index: number, newContent: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  history, 
  onSendMessage, 
  onClearMemory,
  onStopProcessing,
  isProcessing, 
  selectedModelId, 
  availableModels = [],
  onModelChange, 
  onToggleCollapse,
  onEditMessage
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [renderStartIndex, setRenderStartIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, renderStartIndex, isProcessing]);

  useEffect(() => {
    if (history.length === 0) {
      setRenderStartIndex(0);
    }
  }, [history]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isProcessing) {
      if (editingIndex !== null) {
        onEditMessage(editingIndex, input);
        setEditingIndex(null);
      } else {
        onSendMessage(input, attachments);
      }
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && editingIndex !== null) {
      setEditingIndex(null);
      setInput('');
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setInput(history[index].content);
    textareaRef.current?.focus();
  };

  const handleClearUI = () => {
    setRenderStartIndex(history.length);
  };

  const handleResetMemory = () => {
    if (confirm("Reset Chat Memory?\n\nThis will permanently delete the conversation history from the AI's memory. This action cannot be undone.")) {
      onClearMemory();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const newAttachments: ChatAttachment[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const promise = new Promise<void>((resolve) => {
        reader.onload = () => {
          newAttachments.push({ name: file.name, mimeType: file.type, data: reader.result as string });
          resolve();
        };
      });
      reader.readAsDataURL(file);
      await promise;
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const visibleHistory = history.slice(renderStartIndex);

  return (
    <div className="flex flex-col h-full bg-inherit w-full transition-colors duration-300">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={onToggleCollapse} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 transition-colors">
            <ChevronRight size={14} />
          </button>
          <Bot size={16} className="text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Architect</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-lg">
            <button 
              onClick={handleClearUI} 
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
              title="Clear UI (Keep Memory)"
            >
              <Eraser size={14} />
            </button>
            <button 
              onClick={handleResetMemory} 
              className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-500 hover:text-red-500 transition-all"
              title="Reset Memory (Clear History)"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <select 
              value={selectedModelId}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-[10px] font-bold px-2 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-white/50 dark:bg-transparent">
        {visibleHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 text-center space-y-4 px-6">
            <Sparkles size={32} className="opacity-50" />
            <p className="text-[11px] italic leading-relaxed">
              Describe the changes you want for your plugin. The new Gemini models are ready to process your requests.
            </p>
          </div>
        )}
        {visibleHistory.map((msg, i) => {
          const actualIndex = renderStartIndex + i;
          const isUser = msg.role === 'user';
          const isEditing = editingIndex === actualIndex;

          return (
            <div key={actualIndex} className={`flex flex-col group ${isUser ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-start gap-2 max-w-[95%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`mt-1 p-1.5 rounded-lg flex-shrink-0 ${isUser ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-blue-500/10'}`}>
                  {isUser ? <User size={12} className="text-zinc-500 dark:text-zinc-400" /> : <Bot size={12} className="text-blue-500" />}
                </div>
                <div className="relative group/msg">
                  <div className={`p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm break-words whitespace-pre-wrap transition-all ${
                    isEditing ? 'ring-2 ring-blue-500/50 scale-[1.02]' : ''
                  } ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-700/50'
                  }`}>
                    {msg.content}
                    {isEditing && (
                      <div className="mt-2 text-[10px] text-blue-200 font-bold flex items-center gap-1">
                        <Pencil size={10} /> Editing...
                      </div>
                    )}
                  </div>
                  
                  {/* Message Controls */}
                  <div className={`absolute bottom-0 ${isUser ? 'left-full ml-2' : 'right-full mr-2'} mb-1 flex flex-col gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                    <button 
                      onClick={() => handleCopy(msg.content, actualIndex)}
                      className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all"
                      title="Copy message"
                    >
                      {copiedIndex === actualIndex ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-zinc-400" />}
                    </button>
                    {isUser && (
                      <button 
                        onClick={() => handleEdit(actualIndex)}
                        className={`p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all ${isEditing ? 'text-blue-500 border-blue-500' : 'text-zinc-400'}`}
                        title="Edit and resend"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isProcessing && (
          <div className="flex flex-col gap-3 px-4">
            <div className="flex items-center gap-2 text-blue-500">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-tighter animate-pulse">Architect is thinking...</span>
            </div>
            <button 
              onClick={onStopProcessing}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-bold transition-all w-fit active:scale-95"
            >
              <Square size={12} fill="currentColor" /> Stop Generating
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        {editingIndex !== null && (
          <div className="mb-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
              <Pencil size={10} /> Editing Message #{editingIndex + 1}
            </div>
            <button onClick={() => { setEditingIndex(null); setInput(''); }} className="text-zinc-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((file, idx) => (
              <div key={idx} className="bg-blue-500/10 border border-blue-500/20 p-1 rounded-lg flex items-center gap-2 text-[9px]">
                <FileText size={10} className="text-blue-500"/>
                <span className="max-w-[80px] truncate text-zinc-600 dark:text-zinc-300">{file.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-zinc-400 hover:text-red-500 transition-colors">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={`flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl p-2 focus-within:ring-1 transition-all shadow-sm ${editingIndex !== null ? 'ring-1 ring-blue-500/50 shadow-blue-500/10' : 'focus-within:ring-blue-500/30'}`}>
          <div className="flex items-center gap-1 mb-0.5">
            <button 
              type="submit" 
              disabled={(!input.trim() && attachments.length === 0) || isProcessing} 
              className={`p-2.5 rounded-xl transition-all disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:hover:bg-transparent ${
                editingIndex !== null ? 'text-amber-500 hover:bg-amber-500/10' : 'text-blue-500 hover:bg-blue-500/10'
              }`}
              title={editingIndex !== null ? "Save and Resend" : "Send Message"}
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : (editingIndex !== null ? <RefreshCw size={18} /> : <Send size={18} />)}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            rows={1}
            placeholder={editingIndex !== null ? "Edit your message..." : "Request code changes..."}
            className="flex-1 bg-transparent border-none resize-none py-2.5 px-2 text-[13px] outline-none max-h-40 custom-scrollbar text-zinc-800 dark:text-zinc-100 leading-relaxed transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
