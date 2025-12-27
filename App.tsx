
import React, { useState, useEffect, useCallback, useRef } from 'react';
import FileTree from './components/FileTree';
import CodeEditor from './components/CodeEditor';
import ChatPanel from './components/ChatPanel';
import SnapshotManager from './components/SnapshotManager';
import DebugConsole from './components/DebugConsole';
import RoadmapManager from './components/RoadmapManager';
import { ProjectState, FileEntry, ChatMessage, ChatAttachment, AIModelConfig, ProjectSnapshot, ProjectIssue, ProjectTask } from './types';
import { DEFAULT_FILES } from './constants';
import { processArchitectRequest, processDebugRequest } from './services/gemini';
import { saveProject, loadProject, saveSnapshot, getSnapshots, deleteSnapshot, saveIssue, getIssues, deleteIssue } from './services/db';
import { scanLocalDirectory, reconcileFiles, saveFileToLocal, SyncProgress } from './services/sync';
import { Sun, Moon, PanelLeft, PanelRight, Loader2, Menu, MessageSquare, FolderSync, AlertCircle, X, History, Bug, ClipboardList, ShieldAlert, Download, RefreshCw, CheckCircle2, GripVertical } from 'lucide-react';

declare const JSZip: any;

const PREDEFINED_MODELS: AIModelConfig[] = [
  { id: '3pro', name: 'Gemini 3 Pro', provider: 'gemini', modelName: 'gemini-3-pro-preview', baseUrl: '', apiKey: '' },
  { id: '3flash', name: 'Gemini 3 Flash', provider: 'gemini', modelName: 'gemini-3-flash-preview', baseUrl: '', apiKey: '' },
  { id: '25pro', name: 'Gemini 2.5 Pro', provider: 'gemini', modelName: 'gemini-2.5-pro-preview', baseUrl: '', apiKey: '' },
  { id: '25flash', name: 'Gemini 2.5 Flash', provider: 'gemini', modelName: 'gemini-2.5-flash-preview-09-2025', baseUrl: '', apiKey: '' }
];

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>({
    files: DEFAULT_FILES,
    activeFilePath: 'README.md',
    selectedModelId: '3pro',
    chatHistory: [],
    changedFilePaths: [],
    theme: 'dark',
    models: PREDEFINED_MODELS,
    isSynced: false,
    issues: [],
    tasks: []
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [leftPanelVisible, setLeftPanelVisible] = useState(window.innerWidth > 1024);
  const [rightPanelVisible, setRightPanelVisible] = useState(window.innerWidth > 1280);
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    const saved = localStorage.getItem('rightPanelWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ status: 'idle', percentage: 0, currentFile: '' });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const SWIPE_THRESHOLD = 70;

  const [showSnapshotManager, setShowSnapshotManager] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await loadProject();
        if (saved) {
          setProject(prev => ({ 
            ...prev, 
            ...saved, 
            models: PREDEFINED_MODELS, 
            selectedModelId: saved.selectedModelId || '3pro',
            isSynced: false
          }));
        }
        const savedSnaps = await getSnapshots();
        setSnapshots(savedSnaps);
        const savedIssues = await getIssues();
        setIssues(savedIssues);
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        setIsInitialLoad(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('rightPanelWidth', rightPanelWidth.toString());
  }, [rightPanelWidth]);

  const handleRightResizeMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth < 1024) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightPanelWidth;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(Math.max(280, startWidth + delta), window.innerWidth * 0.6);
      setRightPanelWidth(newWidth);
    };
    
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touchEndPosX = e.changedTouches[0].clientX;
    const touchEndPosY = e.changedTouches[0].clientY;
    const diffX = touchEndPosX - touchStartPos.current.x;
    const diffY = touchEndPosY - touchStartPos.current.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > SWIPE_THRESHOLD) {
        if (rightPanelVisible && window.innerWidth < 1024) setRightPanelVisible(false);
        else if (!leftPanelVisible) setLeftPanelVisible(true);
      } else if (diffX < -SWIPE_THRESHOLD) {
        if (leftPanelVisible && window.innerWidth < 1024) setLeftPanelVisible(false);
        else if (!rightPanelVisible) setRightPanelVisible(true);
      }
    }
    touchStartPos.current = null;
  };

  const handleSyncLocal = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        setErrorMessage("Your browser does not support the File System Access API.");
        return;
      }
      
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setDirectoryHandle(handle);
      setSyncProgress({ status: 'scanning', percentage: 10, currentFile: 'Folder Root', message: 'Scanning local directory...' });
      
      const localFiles = await scanLocalDirectory(handle);
      setSyncProgress({ status: 'scanning', percentage: 40, currentFile: '', message: 'Analyzing differences...' });
      
      const { updatedFiles, hasChanges } = reconcileFiles(project.files, localFiles);
      
      setSyncProgress({ status: 'syncing', percentage: 60, currentFile: '', message: 'Saving changes to disk...' });
      
      let count = 0;
      for (const file of project.files) {
        count++;
        setSyncProgress(prev => ({ 
          ...prev, 
          percentage: 60 + Math.floor((count / project.files.length) * 30),
          currentFile: file.name 
        }));
        await saveFileToLocal(handle, file);
      }

      setProject(p => ({ ...p, files: updatedFiles, isSynced: true, lastSyncTime: Date.now() }));
      setSyncProgress({ status: 'completed', percentage: 100, currentFile: '', message: 'Sync completed successfully.' });
      
      setTimeout(() => setSyncProgress(prev => ({ ...prev, status: 'idle' })), 3000);

    } catch (e: any) {
      if (e.name === 'AbortError') {
        setSyncProgress({ status: 'idle', percentage: 0, currentFile: '' });
        return;
      }
      setSyncProgress({ status: 'error', percentage: 0, currentFile: '', message: e.message });
      setErrorMessage("Sync failed: " + e.message);
      console.error("Sync failure:", e);
    }
  };

  const handleDownloadZip = async () => {
    try {
      if (typeof JSZip === 'undefined') {
        setErrorMessage("JSZip library not found.");
        return;
      }
      const zip = new JSZip();
      project.files.forEach(file => { if (file.type === 'file') zip.file(file.path, file.content); });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'obsidian-plugin-architect.zip';
      link.click();
    } catch (e: any) { setErrorMessage("ZIP generation failed: " + e.message); }
  };

  const handleSendMessage = async (message: string, attachments: ChatAttachment[]) => {
    const activeModel = PREDEFINED_MODELS.find(m => m.id === project.selectedModelId) || PREDEFINED_MODELS[0];
    const newUserMsg: ChatMessage = { role: 'user', content: message, timestamp: Date.now(), attachments };
    setProject(prev => ({ ...prev, chatHistory: [...prev.chatHistory, newUserMsg], changedFilePaths: [] }));
    setIsProcessing(true);
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await processArchitectRequest(
        message, project.files, project.chatHistory, activeModel.modelName, attachments,
        issues.filter(i => i.status !== 'resolved'), project.tasks || []
      );
      
      if (!abortControllerRef.current) return;

      const architectMsg: ChatMessage = { role: 'assistant', content: response.chatMessage, timestamp: Date.now() };
      const newFiles = [...project.files];
      let newlyCreatedPath = null;

      response.files.forEach((newFile: any) => {
        const index = newFiles.findIndex(f => f.path === newFile.path);
        if (index > -1) {
          newFiles[index] = { ...newFiles[index], content: newFile.content };
        } else {
          newFiles.push({ name: newFile.path.split('/').pop() || newFile.path, path: newFile.path, type: 'file', content: newFile.content });
          if (newFile.path === 'PLAN.md') newlyCreatedPath = 'PLAN.md';
        }
      });
      
      setProject(prev => ({ 
        ...prev, 
        files: newFiles, 
        chatHistory: [...prev.chatHistory, architectMsg], 
        changedFilePaths: response.files.map((f: any) => f.path), 
        tasks: response.tasks || prev.tasks,
        activeFilePath: newlyCreatedPath || prev.activeFilePath
      }));
      
      if (directoryHandle) {
        for (const f of response.files) {
          await saveFileToLocal(directoryHandle, { name: f.path, path: f.path, content: f.content, type: 'file' });
        }
      }
    } catch (error: any) {
      if (abortControllerRef.current) {
        setProject(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'system', content: `Error: ${error.message}`, timestamp: Date.now() }] }));
      }
    } finally { 
      setIsProcessing(false); 
      abortControllerRef.current = null;
    }
  };

  const handleAddIssue = async (log: string) => {
    const issueId = Math.random().toString(36).substring(2, 11);
    const newIssue: ProjectIssue = {
      id: issueId,
      errorLog: log,
      status: 'analyzing',
      timestamp: Date.now()
    };
    
    const updatedIssues = [...issues, newIssue];
    setIssues(updatedIssues);
    setIsProcessing(true);

    try {
      const activeModel = PREDEFINED_MODELS.find(m => m.id === project.selectedModelId) || PREDEFINED_MODELS[0];
      
      // Phase 1: Analyzing
      const analysisResponse = await processDebugRequest(log, project.files, activeModel.modelName);
      
      // Update with analysis results
      const resolvedIssues = updatedIssues.map(i => i.id === issueId ? {
        ...i, 
        status: analysisResponse.status as any || 'resolved',
        analysis: analysisResponse.explanation
      } : i);
      setIssues(resolvedIssues);

      // Apply files if provided
      if (analysisResponse.files && analysisResponse.files.length > 0) {
        const newFiles = [...project.files];
        analysisResponse.files.forEach((newFile: any) => {
          const index = newFiles.findIndex(f => f.path === newFile.path);
          if (index > -1) newFiles[index] = { ...newFiles[index], content: newFile.content };
          else newFiles.push({ name: newFile.path.split('/').pop() || newFile.path, path: newFile.path, type: 'file', content: newFile.content });
        });
        
        setProject(prev => ({ ...prev, files: newFiles, changedFilePaths: analysisResponse.files.map((f: any) => f.path) }));
        
        if (directoryHandle) {
          for (const f of analysisResponse.files) {
            await saveFileToLocal(directoryHandle, { name: f.path, path: f.path, content: f.content, type: 'file' });
          }
        }
      }

      // Record in chat
      const debugMsg: ChatMessage = { 
        role: 'system', 
        content: `🐞 Debug Fix Applied: ${analysisResponse.explanation}`, 
        timestamp: Date.now() 
      };
      setProject(prev => ({ ...prev, chatHistory: [...prev.chatHistory, debugMsg] }));
      
      await saveIssue(newIssue);
    } catch (e: any) {
      setIssues(updatedIssues.map(i => i.id === issueId ? { ...i, status: 'open' } : i));
      setErrorMessage("Debug Fix Failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuildFromPlan = () => {
    const planFile = project.files.find(f => f.path === 'PLAN.md');
    if (!planFile) return;
    handleSendMessage("Build Plugin from Specs: Please implement all the features and file structures exactly as defined in the PLAN.md file.", []);
  };

  const handleStopProcessing = () => {
    if (isProcessing) {
      abortControllerRef.current = null;
      setIsProcessing(false);
      setProject(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, { role: 'system', content: "Response paused by user.", timestamp: Date.now() }]
      }));
    }
  };

  const handleEditMessage = (index: number, newContent: string) => {
    const updatedHistory = project.chatHistory.slice(0, index);
    setProject(prev => ({ ...prev, chatHistory: updatedHistory }));
    handleSendMessage(newContent, []);
  };

  const handleClearMemory = () => {
    setProject(prev => ({ ...prev, chatHistory: [] }));
  };

  useEffect(() => {
    if (project.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [project.theme]);

  useEffect(() => {
    if (!isInitialLoad) saveProject(project).catch(console.error);
  }, [project, isInitialLoad]);

  if (isInitialLoad) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-blue-500"><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div 
      className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans transition-colors duration-300 relative"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {syncProgress.status !== 'idle' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-sm text-center">
            {syncProgress.status === 'completed' ? (
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4 animate-bounce" />
            ) : (
              <RefreshCw size={48} className="text-blue-500 mx-auto mb-4 animate-spin" />
            )}
            <h3 className="font-bold text-lg mb-2">{syncProgress.message}</h3>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${syncProgress.percentage}%` }} />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono truncate">{syncProgress.currentFile}</p>
          </div>
        </div>
      )}

      {showSnapshotManager && <SnapshotManager snapshots={snapshots} onClose={() => setShowSnapshotManager(false)} onRestore={(s) => { setProject(p => ({...p, files: s.files, activeFilePath: s.activeFilePath})); setShowSnapshotManager(false); }} onSave={async (n) => { const s = { id: Math.random().toString(36).substring(2,11), name: n, timestamp: Date.now(), files: [...project.files], activeFilePath: project.activeFilePath }; await saveSnapshot(s); setSnapshots(p => [...p, s]); }} onDelete={(id) => deleteSnapshot(id).then(() => setSnapshots(s => s.filter(x => x.id !== id)))} />}
      
      {showDebugConsole && (
        <DebugConsole 
          issues={issues} 
          isProcessing={isProcessing}
          onClose={() => setShowDebugConsole(false)} 
          onAddIssue={handleAddIssue} 
          onUpdateStatus={(id, s) => { const up = issues.map(i => i.id === id ? {...i, status: s} : i); setIssues(up); }} 
          onDeleteIssue={(id) => deleteIssue(id).then(() => setIssues(s => s.filter(x => x.id !== id)))} 
        />
      )}
      
      {showRoadmap && <RoadmapManager tasks={project.tasks || []} onClose={() => setShowRoadmap(false)} onExecuteTask={(t) => { setShowRoadmap(false); setRightPanelVisible(true); setTimeout(() => handleSendMessage(t, []), 300); }} />}

      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300 text-xs leading-relaxed border border-red-400/30">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold mb-1">System Error:</p>
            <p>{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>
      )}

      <aside style={{ width: leftPanelVisible ? (window.innerWidth < 1024 ? '85vw' : '260px') : '0px' }} className="fixed lg:relative inset-y-0 left-0 z-50 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 overflow-hidden">
        <FileTree 
          files={project.files} activeFile={project.activeFilePath} changedFilePaths={project.changedFilePaths || []} isSynced={project.isSynced} 
          onSelect={(path) => { setProject(p => ({ ...p, activeFilePath: path })); if (window.innerWidth < 1024) setLeftPanelVisible(false); }} 
          onSync={handleSyncLocal} onDownload={handleDownloadZip} onToggleCollapse={() => setLeftPanelVisible(false)} 
          onAddFile={(name) => setProject(p => ({ ...p, files: [...p.files, { name, path: name, content: '', type: 'file' }], activeFilePath: name }))} 
          onDeleteFile={(path) => setProject(p => ({ ...p, files: p.files.filter(f => f.path !== path), activeFilePath: p.activeFilePath === path ? 'README.md' : p.activeFilePath }))} 
        />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative z-10">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {!leftPanelVisible && <button onClick={() => setLeftPanelVisible(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><Menu size={20} /></button>}
            <h1 className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-100 truncate">Architect Pro IDE</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => handleSendMessage("Perform an AI Audit of this project.", [])} disabled={isProcessing} className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-blue-500 transition-all disabled:opacity-50">
              <ShieldAlert size={18} />
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Audit</span>
            </button>
            <button onClick={() => setShowRoadmap(true)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-all">
              <ClipboardList size={18} />
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Roadmap</span>
            </button>
            <button onClick={() => setShowDebugConsole(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 relative">
              <Bug size={18} />
              {issues.filter(i => i.status !== 'resolved').length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse border-2 border-white dark:border-zinc-950" />}
            </button>
            <button onClick={() => setShowSnapshotManager(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-all"><History size={18} /></button>
            <button onClick={() => setProject(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"> {project.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} </button>
            {!rightPanelVisible && <button onClick={() => setRightPanelVisible(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><MessageSquare size={18} /></button>}
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <CodeEditor 
            content={project.files.find(f => f.path === project.activeFilePath)?.content || ''} 
            fileName={project.activeFilePath?.split('/').pop() || ''} 
            isProcessing={isProcessing}
            onBuildFromPlan={handleBuildFromPlan}
            onChange={(val) => { const updated = project.files.map(f => f.path === project.activeFilePath ? {...f, content: val} : f); setProject(prev => ({...prev, files: updated})); if (directoryHandle) saveFileToLocal(directoryHandle, { name: project.activeFilePath!, path: project.activeFilePath!, content: val, type: 'file' }); }} 
          />
        </div>
      </main>

      <aside 
        style={{ width: rightPanelVisible ? (window.innerWidth < 1024 ? '90vw' : `${rightPanelWidth}px`) : '0px' }} 
        className="fixed lg:relative inset-y-0 right-0 z-50 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300"
      >
        {/* Resize Handle (Desktop Only) */}
        {rightPanelVisible && window.innerWidth >= 1024 && (
          <div 
            onMouseDown={handleRightResizeMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-[60] flex items-center justify-center group"
          >
             <div className="opacity-0 group-hover:opacity-100 bg-blue-500 w-0.5 h-8 rounded-full" />
          </div>
        )}
        
        <div className="h-full overflow-hidden">
          <ChatPanel 
            history={project.chatHistory} 
            onSendMessage={handleSendMessage} 
            onClearMemory={handleClearMemory}
            onStopProcessing={handleStopProcessing}
            onEditMessage={handleEditMessage}
            isProcessing={isProcessing} 
            selectedModelId={project.selectedModelId} 
            availableModels={PREDEFINED_MODELS} 
            onModelChange={(id) => setProject(p => ({ ...p, selectedModelId: id }))} 
            onToggleCollapse={() => setRightPanelVisible(false)} 
          />
        </div>
      </aside>
    </div>
  );
};

export default App;
