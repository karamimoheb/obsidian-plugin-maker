
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Copy, Check, Eye, Code, FileCode, Rocket } from 'lucide-react';
import { marked } from 'marked';
import Prism from 'prismjs';

// Load Prism languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';

interface CodeEditorProps {
  content: string;
  onChange: (value: string) => void;
  onBuildFromPlan?: () => void;
  fileName: string;
  isProcessing?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange, onBuildFromPlan, fileName, isProcessing }) => {
  const [copied, setCopied] = useState(false);
  const isMarkdown = fileName.toLowerCase().endsWith('.md');
  const isPlanFile = fileName === 'PLAN.md';
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(isMarkdown ? 'preview' : 'edit');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const contentDirection = useMemo(() => {
    if (!isMarkdown) return 'ltr';
    const sample = content.slice(0, 500);
    const rtlChars = sample.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g);
    return (rtlChars?.length || 0) > (sample.length * 0.2) ? 'rtl' : 'ltr';
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
      case 'css': return 'css';
      case 'md': return 'markdown';
      default: return 'clike';
    }
  }, [fileName]);

  useEffect(() => {
    setViewMode(isMarkdown ? 'preview' : 'edit');
  }, [fileName, isMarkdown]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const highlightedCode = useMemo(() => {
    const grammer = Prism.languages[language] || Prism.languages.clike;
    const code = content + (content.endsWith('\n') ? ' ' : '');
    return Prism.highlight(code, grammer, language);
  }, [content, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedHtml = useMemo(() => {
    if (!isMarkdown) return '';
    try {
      // Marked.parse returns a string or a promise depending on config
      return marked.parse(content) as string;
    } catch (e) {
      return '<p>Error rendering preview.</p>';
    }
  }, [content, isMarkdown]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#09090b] overflow-hidden relative">
      <div className="h-14 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          <FileCode size={16} className="text-blue-500 flex-shrink-0" />
          <span className="text-[11px] font-mono font-bold text-zinc-500 truncate uppercase tracking-widest">{fileName}</span>
          <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1 ml-2">
            {isMarkdown && (
              <button onClick={() => setViewMode('preview')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500'}`}>
                <Eye size={12} className="inline mr-1" /> View
              </button>
            )}
            <button onClick={() => setViewMode('edit')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500'}`}>
              <Code size={12} className="inline mr-1" /> Editor
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPlanFile && onBuildFromPlan && (
            <button onClick={onBuildFromPlan} disabled={isProcessing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 transition-all">
              <Rocket size={14} /> <span className="hidden xs:inline">Build Plugin</span>
            </button>
          )}
          <button onClick={handleCopy} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
        {viewMode === 'edit' ? (
          <div className="editor-container">
            <div ref={highlightRef} className="editor-highlight custom-scrollbar">
              <pre className={`language-${language}`}><code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} /></pre>
            </div>
            <textarea ref={textareaRef} value={content} onChange={(e) => onChange(e.target.value)} onScroll={handleScroll} spellCheck={false} className="editor-textarea custom-scrollbar" />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-auto custom-scrollbar p-6 bg-white dark:bg-zinc-950">
            <div className={`max-w-4xl mx-auto ${contentDirection === 'rtl' ? 'prose-rtl' : 'prose-ltr'} prose dark:prose-invert`} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
