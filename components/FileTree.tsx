
import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  ChevronLeft, 
  Sparkles, 
  Plus, 
  Trash2, 
  HardDrive, 
  Package, 
  FileCode, 
  FileJson, 
  FileText, 
  Zap, 
  ShieldAlert,
  Layers,
  Eraser
} from 'lucide-react';
import { FileEntry } from '../types';

interface FileTreeProps {
  files: FileEntry[];
  activeFile: string | null;
  changedFilePaths: string[];
  isSynced?: boolean;
  onSelect: (path: string) => void;
  onDownload: () => void;
  onSync: () => void;
  onToggleCollapse: () => void;
  onAddFile: (name: string) => void;
  onDeleteFile: (path: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ 
  files, 
  activeFile, 
  changedFilePaths,
  isSynced,
  onSelect, 
  onSync,
  onDownload,
  onToggleCollapse,
  onAddFile,
  onDeleteFile
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onAddFile(newFileName.trim());
      setNewFileName('');
      setIsAdding(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (fileName === 'package.json' || fileName === 'manifest.json' || fileName === 'versions.json') {
      return <FileJson size={16} className="text-amber-500" />;
    }
    if (fileName === 'tsconfig.json') {
      return <FileJson size={16} className="text-blue-500" />;
    }
    if (fileName === 'esbuild.config.mjs' || fileName.includes('config')) {
      return <Zap size={16} className="text-yellow-500" />;
    }
    if (fileName === '.gitignore' || fileName.startsWith('.')) {
      return <ShieldAlert size={16} className="text-zinc-500" />;
    }
    
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode size={16} className="text-blue-400" />;
      case 'json':
        return <FileJson size={16} className="text-amber-400" />;
      case 'css':
      case 'scss':
        return <FileCode size={16} className="text-pink-400" />;
      case 'md':
        return <FileText size={16} className="text-emerald-500" />;
      default:
        return <File size={16} className="text-zinc-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-inherit w-full text-sm select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 h-14">
        <h2 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px]">Explorer</h2>
        <div className="flex items-center gap-1">
          <button onClick={onToggleCollapse} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 lg:hidden">
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Quick Actions Toolbar */}
      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center gap-1 bg-zinc-50/30 dark:bg-zinc-900/30">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors uppercase tracking-tighter"
        >
          <Plus size={14} className="text-blue-500" />
          <span>New File</span>
        </button>
        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800 mx-1" />
        <button 
          onClick={() => {
            if(confirm('Do you want to clear old and unnecessary files?')) {
              alert('This feature will be integrated with AI in future versions.');
            }
          }}
          className="flex items-center gap-1.5 px-2 py-1 hover:bg-red-500/10 hover:text-red-500 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors uppercase tracking-tighter"
        >
          <Eraser size={14} />
          <span>Cleanup</span>
        </button>
      </div>
      
      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {isAdding && (
          <form onSubmit={handleAdd} className="px-2 py-1 mb-2">
            <input 
              autoFocus
              className="w-full bg-white dark:bg-zinc-800 border border-blue-500 rounded px-2 py-1 text-xs outline-none font-mono text-zinc-800 dark:text-zinc-200"
              placeholder="filename.ts"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onBlur={() => !newFileName && setIsAdding(false)}
            />
          </form>
        )}

        {files.map((file) => {
          const isChanged = changedFilePaths.includes(file.path);
          const isActive = activeFile === file.path;
          return (
            <div 
              key={file.path}
              onClick={() => onSelect(file.path)}
              className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                isActive 
                  ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex-shrink-0 transition-transform group-hover:scale-110 duration-200">
                {file.type === 'folder' ? <Folder size={16} className="text-blue-500" /> : getFileIcon(file.name)}
              </div>
              <span className="truncate flex-1 font-medium font-mono text-[12px]">{file.name}</span>
              
              <div className="flex items-center gap-2">
                {isChanged && <Sparkles size={12} className="text-amber-500 animate-pulse" />}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  {file.path !== 'README.md' && file.path !== 'manifest.json' && file.path !== 'main.ts' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm(`Delete ${file.name}?`)) onDeleteFile(file.path); }}
                      className="p-1 hover:text-red-500 text-zinc-400 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50">
        <button 
          onClick={onSync}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] border shadow-sm ${
            isSynced 
              ? 'bg-green-600/10 border-green-500/20 text-green-600 dark:text-green-400' 
              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/50'
          }`}
        >
          <HardDrive size={14} />
          {isSynced ? 'Linked to Local' : 'Sync Local Folder'}
        </button>

        <button 
          onClick={onDownload}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
        >
          <Package size={14} />
          Download ZIP
        </button>
        
        <p className="text-[9px] text-zinc-400 dark:text-zinc-600 text-center px-2 leading-relaxed pt-1 opacity-70">
          {isSynced ? 'Changes are saved in real-time.' : 'For manual installation in Obsidian.'}
        </p>
      </div>
    </div>
  );
};

export default FileTree;
