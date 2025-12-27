
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Copy, Check, Eye, Code, FileCode } from 'lucide-react';

interface CodeEditorProps {
  content: string;
  onChange: (value: string) => void;
  fileName: string;
}

declare const marked: any;
declare const Prism: any;

const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange, fileName }) => {
  const [copied, setCopied] = useState(false);
  const isMarkdown = fileName.toLowerCase().endsWith('.md');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(isMarkdown ? 'preview' : 'edit');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Determine language for Prism highlighting
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

  // Sync scroll between textarea and highlighting layer
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  };

  // Process highlighting
  const highlightedCode = useMemo(() => {
    if (typeof Prism === 'undefined' || !Prism.languages[language]) {
      return content;
    }
    // Add a space at the end to ensure the last line/character is always visible if it's empty
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
      return '<p class="text-red-500 font-vazir text-center">خطا در نمایش پیش‌نمایش.</p>';
    }
  }, [content, isMarkdown]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#09090b] overflow-hidden">
      <div className="h-14 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
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

        <button 
          onClick={handleCopy}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
          title="کپی محتوا"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

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
          <div className="absolute inset-0 overflow-auto custom-scrollbar p-6 sm:p-10 bg-white dark:bg-zinc-950" ref={previewRef}>
            <div className="max-w-4xl mx-auto prose-rtl" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
