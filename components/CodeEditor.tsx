
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Copy, Check, Eye, Code, FileCode, Rocket, Zap } from 'lucide-react';

interface CodeEditorProps {
  content: string;
  onChange: (value: string) => void;
  onBuildFromPlan?: () => void;
  fileName: string;
  isProcessing?: boolean;
}

declare const marked: any;
declare const Prism: any;

const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange, onBuildFromPlan, fileName, isProcessing }) => {
  const [copied, setCopied] = useState(false);
  const isMarkdown = fileName.toLowerCase().endsWith('.md');
  const isPlanFile = fileName === 'PLAN.md';
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(isMarkdown ? 'preview' : 'edit');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Helper to detect if content is primarily RTL (Persian/Arabic)
  const contentDirection = useMemo(() => {
    if (!isMarkdown) return 'ltr';
    
    // Check first 500 characters for RTL language patterns
    const sample = content.slice(0, 500);
    const rtlChars = sample.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g);
    const rtlCount = rtlChars ? rtlChars.length : 0;
    
    // If more than 20% of the sample is RTL, treat the whole document as RTL
    return rtlCount > (sample.length * 0.2) ? 'rtl' : 'ltr';
  }, [content, isMarkdown]);

  const language = useMemo(() => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx': return 'typescript';
      case 'js':
      case 'jsx':
      case 'mjs': return 'javascript';
      case 'json': return 'json';
      case 'css':
      case 'scss': return 'css';
      case 'md': return 'markdown';
      default: return 'clike';
    }
  }, [fileName]);

  useEffect(() => {
    setViewMode(isMarkdown ? 'preview' : 'edit');
  }, [fileName, isMarkdown]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  };

  const highlightedCode = useMemo(() => {
    if (typeof Prism === 'undefined' || !Prism.languages[language]) {
      return content;
    }
    const code = content + (content.endsWith('\n') ? ' ' : '');
    return Prism.highlight(code, Prism.languages[language], language);
  }, [content, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedHtml = useMemo(() => {
    if (!isMarkdown || typeof marked === 'undefined') return '';
    try {
      marked.setOptions({ breaks: true, gfm: true });
      return marked.parse(content);
    } catch (e) {
      return '<p class="text-red-500 text-center font-bold">Error rendering preview.</p>';
    }
  }, [content, isMarkdown]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#09090b] overflow-hidden relative">
      <div className="h-14 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          <FileCode size={16} className="text-blue-500 flex-shrink-0" />
          <span className="text-[11px] font-mono font-bold text-zinc-500 truncate max-w-[150px] sm:max-w-none uppercase tracking-widest">
            {fileName}
          </span>

          <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1 ml-2">
            {isMarkdown && (
              <button 
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <Eye size={12} className="inline mr-1" /> View
              </button>
            )}
            <button 
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Code size={12} className="inline mr-1" /> Editor
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPlanFile && onBuildFromPlan && (
            <button 
              onClick={onBuildFromPlan}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <Rocket size={14} />
              <span className="hidden xs:inline">Build Plugin from Specs</span>
            </button>
          )}
          <button 
            onClick={handleCopy}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
            title="Copy content"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Floating Build Button for Preview Mode of PLAN.md */}
      {isPlanFile && viewMode === 'preview' && onBuildFromPlan && !isProcessing && (
        <button 
          onClick={onBuildFromPlan}
          className="absolute bottom-8 right-8 z-30 flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl shadow-blue-500/40 transition-all hover:-translate-y-1 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Zap size={20} fill="currentColor" />
          Generate Implementation from Plan
        </button>
      )}

      <div className="flex-1 relative overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
        {viewMode === 'edit' ? (
          <div className="editor-container">
            <div 
              ref={highlightRef}
              className="editor-highlight custom-scrollbar"
              aria-hidden="true"
            >
              <pre className={`language-${language}`}>
                <code 
                  className={`language-${language}`}
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              </pre>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="editor-textarea custom-scrollbar"
            />
          </div>
        ) : (
          <div 
            className="absolute inset-0 overflow-auto custom-scrollbar p-6 sm:p-10 bg-white dark:bg-zinc-950" 
            ref={previewRef}
          >
            <div 
              className={`max-w-4xl mx-auto transition-all duration-500 ${
                contentDirection === 'rtl' ? 'prose-rtl' : 'prose-ltr'
              }`} 
              dangerouslySetInnerHTML={{ __html: renderedHtml }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
