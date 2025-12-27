
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Copy, Check, Eye, Code, FileCode } from 'lucide-react';

interface CodeEditorProps {
  content: string;
  onChange: (value: string) => void;
  fileName: string;
}

declare const marked: any;

const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange, fileName }) => {
  const [copied, setCopied] = useState(false);
  const isMarkdown = fileName.toLowerCase().endsWith('.md');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(isMarkdown ? 'preview' : 'edit');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewMode(isMarkdown ? 'preview' : 'edit');
  }, [fileName, isMarkdown]);

  useEffect(() => {
    if (viewMode === 'preview' && previewRef.current) {
      const preBlocks = previewRef.current.querySelectorAll('pre');
      preBlocks.forEach((pre) => {
        if (pre.querySelector('.copy-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'copy-btn absolute top-2 right-2 p-1.5 bg-zinc-800 text-zinc-400 rounded border border-zinc-700 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity';
        btn.innerText = 'Copy';
        pre.classList.add('group', 'relative');
        pre.appendChild(btn);
        btn.onclick = () => {
          navigator.clipboard.writeText(pre.innerText.replace('Copy', ''));
          btn.innerText = 'Copied!';
          setTimeout(() => btn.innerText = 'Copy', 2000);
        };
      });
    }
  }, [viewMode, content]);

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
          <span className="text-[11px] font-mono font-bold text-zinc-500 truncate max-w-[120px] sm:max-w-none uppercase tracking-widest">
            {fileName}
          </span>

          {isMarkdown && (
            <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500'}`}
              >
                <Eye size={12} className="inline mr-1" /> View
              </button>
              <button 
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500'}`}
              >
                <Code size={12} className="inline mr-1" /> Edit
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={handleCopy}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
          title="کپی محتوا"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      <div className="flex-1 relative">
        {viewMode === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 w-full h-full bg-transparent text-zinc-800 dark:text-zinc-200 p-4 sm:p-8 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none overflow-auto custom-scrollbar"
            style={{ tabSize: 2 }}
          />
        ) : (
          <div className="absolute inset-0 overflow-auto custom-scrollbar p-6 sm:p-10" ref={previewRef}>
            <div className="max-w-4xl mx-auto prose-rtl" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
