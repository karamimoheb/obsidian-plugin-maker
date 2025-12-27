
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronRight, Paperclip, X, FileText, Sparkles, Cpu } from 'lucide-react';
import { ChatMessage, ChatAttachment, AIModelConfig } from '../types';

interface ChatPanelProps {
  history: ChatMessage[];
  onSendMessage: (msg: string, attachments: ChatAttachment[]) => void;
  isProcessing: boolean;
  selectedModelId: string;
  availableModels: AIModelConfig[];
  onModelChange: (modelId: string) => void;
  onToggleCollapse: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  history, 
  onSendMessage, 
  isProcessing, 
  selectedModelId, 
  availableModels = [],
  onModelChange, 
  onToggleCollapse
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isProcessing) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
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
  };

  return (
    <div className="flex flex-col h-full bg-inherit w-full transition-colors duration-300">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={onToggleCollapse} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 transition-colors">
            <ChevronRight size={14} />
          </button>
          <Bot size={16} className="text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Architect</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Cpu size={12} className="text-zinc-500" />
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-white/50 dark:bg-transparent">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 text-center space-y-4 px-6">
            <Sparkles size={32} className="opacity-50" />
            <p className="text-[11px] font-vazir italic leading-relaxed">
              تغییرات مورد نظر خود را برای پلاگین بنویسید. مدل‌های جدید سری ۲.۵ و ۳ آماده پردازش درخواست‌های شما هستند.
            </p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-start gap-2 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`mt-1 p-1.5 rounded-lg flex-shrink-0 ${msg.role === 'user' ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-blue-500/10'}`}>
                {msg.role === 'user' ? <User size={12} className="text-zinc-500 dark:text-zinc-400" /> : <Bot size={12} className="text-blue-500" />}
              </div>
              <div className={`p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm break-words font-vazir ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-700/50'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 text-blue-500 px-4">
            <Loader2 size={12} className="animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-tighter animate-pulse">Architect is thinking...</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 transition-colors">
            <Paperclip size={18} />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              placeholder="درخواست تغییر کد..."
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2.5 px-4 text-[13px] focus:ring-1 focus:ring-blue-500/30 transition-all font-vazir text-zinc-800 dark:text-zinc-100"
            />
            <button type="submit" disabled={!input.trim() || isProcessing} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 disabled:text-zinc-400 dark:disabled:text-zinc-600 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
