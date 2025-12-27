
import React, { useState } from 'react';
import { Folder, File, Download, ChevronLeft, Sparkles, Plus, Trash2, HardDrive, FilePlus, Package } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full bg-inherit w-full text-sm select-none">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 h-14">
        <h2 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px]">Explorer</h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsAdding(!isAdding)} 
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500"
            title="فایل جدید"
          >
            <Plus size={16} />
          </button>
          <button onClick={onToggleCollapse} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 lg:hidden">
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {isAdding && (
          <form onSubmit={handleAdd} className="px-2 py-1 mb-2">
            <input 
              autoFocus
              className="w-full bg-white dark:bg-zinc-800 border border-blue-500 rounded px-2 py-1 text-xs outline-none font-mono"
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
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex-shrink-0">
                {file.type === 'folder' ? <Folder size={16} className="text-blue-500" /> : <File size={16} />}
              </div>
              <span className="truncate flex-1 font-medium font-mono text-[13px]">{file.name}</span>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isChanged && <Sparkles size={12} className="text-amber-500 animate-pulse" />}
                {file.path !== 'README.md' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFile(file.path); }}
                    className="p-1 hover:text-red-500 text-zinc-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50">
        <button 
          onClick={onSync}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] border ${
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
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10"
        >
          <Package size={14} />
          Download ZIP
        </button>
        
        <p className="text-[9px] text-zinc-400 dark:text-zinc-600 text-center px-2 leading-relaxed font-vazir pt-1">
          {isSynced ? 'تغییرات هم‌زمان ذخیره می‌شوند.' : 'فایل ZIP برای نصب دستی در ابسیدین.'}
        </p>
      </div>
    </div>
  );
};

export default FileTree;
