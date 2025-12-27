
import React, { useState, useEffect, useRef } from 'react';
import FileTree from './components/FileTree';
import CodeEditor from './components/CodeEditor';
import ChatPanel from './components/ChatPanel';
import SnapshotManager from './components/SnapshotManager';
import DebugConsole from './components/DebugConsole';
import RoadmapManager from './components/RoadmapManager';
import LearningModePanel from './components/LearningModePanel';
import { ProjectState, FileEntry, ChatMessage, ChatAttachment, AIModelConfig, ProjectSnapshot, ProjectIssue, ProjectTask, LearningStep } from './types';
import { DEFAULT_FILES } from './constants';
import { processArchitectRequest, processDebugRequest, processLearningStep } from './services/gemini';
import { saveProject, loadProject, saveSnapshot, getSnapshots, deleteSnapshot, saveIssue, getIssues, deleteIssue } from './services/db';
import { scanLocalDirectory } from './services/sync';
import { Sun, Moon, Loader2, Menu, MessageSquare, AlertCircle, X, History, Bug, ClipboardList, BrainCircuit, RefreshCcw } from 'lucide-react';

const PREDEFINED_MODELS: AIModelConfig[] = [
  { id: '3flash', name: 'Gemini 3 Flash', baseUrl: '', apiKey: '', modelName: 'gemini-3-flash-preview', provider: 'gemini' },
  { id: '25pro', name: 'Gemini 2.5 Pro', baseUrl: '', apiKey: '', modelName: 'gemini-2.5-pro-preview', provider: 'gemini' },
  { id: '25flash', name: 'Gemini 2.5 Flash', baseUrl: '', apiKey: '', modelName: 'gemini-2.5-flash-preview-09-2025', provider: 'gemini' }
];

const INITIAL_LEARNING_STEPS: LearningStep[] = [
  { id: 'step-1', title: 'Project Tree & Tech Stack', status: 'pending', description: 'Detect core dependencies and structural organization.' },
  { id: 'step-2', title: 'Entry Points & Lifecycle', status: 'pending', description: 'Find main.ts and Obsidian plugin hooks.' },
  { id: 'step-3', title: 'Core Modules Analysis', status: 'pending', description: 'Trace primary features and business logic.' },
  { id: 'step-4', title: 'Integration Layer', status: 'pending', description: 'Analyze API calls and external events.' },
  { id: 'step-5', title: 'Quality & Patterns', status: 'pending', description: 'Review architecture patterns and risks.' },
  { id: 'step-6', title: 'Knowledge Extraction', status: 'pending', description: 'Generate LEARNING_NOTES.md and PLUGIN_RULES.md.' }
];

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>({
    files: DEFAULT_FILES,
    activeFilePath: 'README.md',
    selectedModelId: '3flash',
    chatHistory: [],
    changedFilePaths: [],
    theme: 'dark',
    models: PREDEFINED_MODELS,
    isSynced: false,
    issues: [],
    tasks: [],
    learningSession: {
      isActive: false,
      currentStep: 0,
      steps: INITIAL_LEARNING_STEPS,
      isPaused: false,
      isZipImported: false
    }
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [leftPanelVisible, setLeftPanelVisible] = useState(window.innerWidth > 1024);
  const [rightPanelVisible, setRightPanelVisible] = useState(window.innerWidth > 1280);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const projectRef = useRef<ProjectState>(project);
  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await loadProject();
        if (saved) {
          setProject(prev => ({ 
            ...prev, 
            ...saved,
            models: PREDEFINED_MODELS // Ensure models are always fresh
          }));
        }
        setSnapshots(await getSnapshots());
        setIssues(await getIssues());
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setIsInitialLoad(false);
      }
    };
    init();
  }, []);

  const [showSnapshotManager, setShowSnapshotManager] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showLearningMode, setShowLearningMode] = useState(false);
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);

  const handleGlobalReset = () => {
    if (confirm("آیا از بازنشانی کامل پروژه اطمینان دارید؟ تمام فایل‌ها، تاریخچه چت، وظایف و مموری پاک خواهند شد.")) {
      const resetState: ProjectState = {
        files: DEFAULT_FILES,
        activeFilePath: 'README.md',
        selectedModelId: '3flash',
        chatHistory: [],
        changedFilePaths: [],
        theme: project.theme,
        models: PREDEFINED_MODELS,
        isSynced: false,
        issues: [],
        tasks: [],
        learningSession: {
          isActive: false,
          currentStep: 0,
          steps: INITIAL_LEARNING_STEPS,
          isPaused: false,
          isZipImported: false
        }
      };
      setProject(resetState);
      saveProject(resetState);
      setIssues([]);
      localStorage.clear();
      window.location.reload(); // Hard reload to ensure clean state
    }
  };

  const handleSyncLocalFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        setErrorMessage("Browser does not support File System Access API. Please use Chrome or Edge.");
        return;
      }
      
      const handle = await (window as any).showDirectoryPicker();
      directoryHandleRef.current = handle;
      
      setIsProcessing(true);
      const localFiles = await scanLocalDirectory(handle);
      
      if (localFiles.length > 0) {
        const newState = {
          ...project,
          files: localFiles,
          isSynced: true,
          activeFilePath: localFiles[0].path
        };
        setProject(newState);
        saveProject(newState);
      } else {
        setErrorMessage("The selected folder is empty or contains no compatible files.");
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Sync Error:", e);
        setErrorMessage("Sync Failed: " + e.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    const { default: JSZip } = await import('jszip');
    try {
      const zip = new JSZip();
      project.files.forEach(file => {
        if (file.type === 'file') {
          zip.file(file.path, file.content);
        }
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'obsidian-plugin-source.zip';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e: any) {
      setErrorMessage("Error generating ZIP: " + e.message);
    }
  };

  const handleSendMessage = async (message: string, attachments: ChatAttachment[]) => {
    const activeModel = PREDEFINED_MODELS.find(m => m.id === project.selectedModelId) || PREDEFINED_MODELS[0];
    const newUserMsg: ChatMessage = { role: 'user', content: message, timestamp: Date.now(), attachments };
    
    setProject(prev => ({ 
      ...prev, 
      chatHistory: [...prev.chatHistory, newUserMsg],
      changedFilePaths: [] 
    }));
    
    setIsProcessing(true);
    try {
      const response = await processArchitectRequest(
        message, 
        project.files, 
        project.chatHistory, 
        activeModel.modelName, 
        attachments, 
        issues.filter(i => i.status !== 'resolved'), 
        project.tasks || []
      );
      
      const newFiles = [...project.files];
      if (response.files && Array.isArray(response.files)) {
        response.files.forEach((nf: any) => {
          const idx = newFiles.findIndex(f => f.path === nf.path);
          if (idx > -1) {
            newFiles[idx] = { ...newFiles[idx], content: nf.content };
          } else {
            newFiles.push({ 
              name: nf.path.split('/').pop() || nf.path, 
              path: nf.path, 
              type: 'file', 
              content: nf.content 
            });
          }
        });
      }
      
      const finalState = { 
        ...project, 
        files: newFiles, 
        chatHistory: [...project.chatHistory, newUserMsg, { role: 'assistant', content: response.chatMessage, timestamp: Date.now() }], 
        tasks: response.tasks || project.tasks 
      };
      setProject(finalState);
      saveProject(finalState);
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred during generation.");
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleImportZip = (importedFiles: FileEntry[]) => {
    if (!importedFiles.length) return;
    const newState = {
      ...project,
      files: importedFiles,
      activeFilePath: importedFiles[0].path,
      isSynced: false,
      learningSession: {
        ...project.learningSession!,
        isZipImported: true,
        isActive: false
      }
    };
    setProject(newState);
    saveProject(newState);
  };

  const handleAddIssue = async (log: string) => {
    const issueId = Math.random().toString(36).substring(2, 11);
    setIssues(prev => [...prev, { id: issueId, errorLog: log, status: 'analyzing', timestamp: Date.now() }]);
    setIsProcessing(true);
    try {
      const activeModel = PREDEFINED_MODELS.find(m => m.id === project.selectedModelId) || PREDEFINED_MODELS[0];
      const analysis = await processDebugRequest(log, project.files, issues.filter(i => i.status === 'resolved'), activeModel.modelName);
      
      const updatedIssue: ProjectIssue = { 
        id: issueId, 
        errorLog: log, 
        timestamp: Date.now(), 
        status: 'resolved', 
        analysis: analysis.explanation, 
        errorType: analysis.errorType, 
        rootCause: analysis.rootCause, 
        resolution: analysis.resolution 
      };
      
      setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));
      
      if (analysis.files?.length) {
        const newFiles = [...project.files];
        analysis.files.forEach((f: any) => {
          const idx = newFiles.findIndex(nf => nf.path === f.path);
          if (idx > -1) newFiles[idx].content = f.content;
          else newFiles.push({ name: f.path.split('/').pop() || f.path, path: f.path, type: 'file', content: f.content });
        });
        setProject(prev => ({ ...prev, files: newFiles, changedFilePaths: analysis.files.map((f: any) => f.path) }));
      }
      await saveIssue(updatedIssue);
    } catch (e: any) { 
      setErrorMessage("Debug Fix Failed: " + e.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleSaveSnapshot = async (name: string) => {
    const newSnapshot: ProjectSnapshot = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      timestamp: Date.now(),
      files: project.files,
      activeFilePath: project.activeFilePath
    };
    try {
      await saveSnapshot(newSnapshot);
      const updatedSnapshots = await getSnapshots();
      setSnapshots(updatedSnapshots);
    } catch (e: any) {
      setErrorMessage("Failed to save snapshot: " + e.message);
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', project.theme === 'dark');
  }, [project.theme]);

  if (isInitialLoad) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-blue-500 font-bold"><Loader2 className="animate-spin mr-2" size={32} /> INITIALIZING ARCHITECT...</div>;

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
      {showLearningMode && project.learningSession && (
        <LearningModePanel 
          session={project.learningSession} 
          onClose={() => setShowLearningMode(false)}
          onStart={() => {}} // Placeholder logic for learning loop
          onRevert={() => {}}
          onPauseToggle={() => {}}
          isProcessing={isProcessing}
          onDownloadNotes={() => {}}
          onDownloadRules={() => {}}
        />
      )}

      {showSnapshotManager && <SnapshotManager snapshots={snapshots} onClose={() => setShowSnapshotManager(false)} onRestore={(s) => { setProject(p => ({...p, files: s.files, activeFilePath: s.activeFilePath})); setShowSnapshotManager(false); }} onSave={(name) => handleSaveSnapshot(name)} onDelete={(id) => deleteSnapshot(id).then(() => setSnapshots(s => s.filter(x => x.id !== id)))} />}
      {showDebugConsole && <DebugConsole issues={issues} isProcessing={isProcessing} onClose={() => setShowDebugConsole(false)} onAddIssue={handleAddIssue} onUpdateStatus={(id, s) => setIssues(p => p.map(i => i.id === id ? {...i, status: s} : i))} onDeleteIssue={(id) => deleteIssue(id).then(() => setIssues(p => p.filter(x => x.id !== id)))} />}
      {showRoadmap && <RoadmapManager tasks={project.tasks || []} onClose={() => setShowRoadmap(false)} onExecuteTask={(t) => { setShowRoadmap(false); handleSendMessage(t, []); }} />}

      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-lg bg-red-600 text-white p-4 rounded-2xl flex items-start gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div className="flex-1 text-xs"><b>System Alert</b><p>{errorMessage}</p></div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={18} /></button>
        </div>
      )}

      <aside style={{ width: leftPanelVisible ? '260px' : '0px' }} className="flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 overflow-hidden">
        <FileTree files={project.files} activeFile={project.activeFilePath} changedFilePaths={project.changedFilePaths || []} onSelect={(path) => setProject(p => ({ ...p, activeFilePath: path }))} isSynced={project.isSynced} onSync={handleSyncLocalFolder} onDownload={handleDownloadZip} onToggleCollapse={() => setLeftPanelVisible(false)} onAddFile={(name) => setProject(p => ({ ...p, files: [...p.files, { name, path: name, content: '', type: 'file' }], activeFilePath: name }))} onDeleteFile={(path) => setProject(p => ({ ...p, files: p.files.filter(f => f.path !== path), activeFilePath: p.activeFilePath === path ? 'README.md' : p.activeFilePath }))} onImportZip={handleImportZip} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {!leftPanelVisible && <button onClick={() => setLeftPanelVisible(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-all"><Menu size={20} /></button>}
            <h1 className="text-sm font-bold tracking-tight">Architect IDE Pro</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={handleGlobalReset} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title="Full Project Reset">
              <RefreshCcw size={18} />
            </button>
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <button onClick={() => setShowRoadmap(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors" title="Roadmap"><ClipboardList size={18} /></button>
            <button onClick={() => setShowSnapshotManager(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors" title="History"><History size={18} /></button>
            <button onClick={() => setShowDebugConsole(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 relative transition-colors" title="Debug Center">
              <Bug size={18} />
              {issues.some(i => i.status !== 'resolved') && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse border-2 border-white dark:border-zinc-950" />}
            </button>
            <button onClick={() => setProject(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
              {project.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!rightPanelVisible && <button onClick={() => setRightPanelVisible(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"><MessageSquare size={18} /></button>}
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <CodeEditor content={project.files.find(f => f.path === project.activeFilePath)?.content || ''} fileName={project.activeFilePath?.split('/').pop() || ''} isProcessing={isProcessing} onChange={(val) => setProject(prev => ({...prev, files: prev.files.map(f => f.path === project.activeFilePath ? {...f, content: val} : f)}))} onBuildFromPlan={() => handleSendMessage("Build plugin from specs", [])} />
        </div>
      </main>

      <aside style={{ width: rightPanelVisible ? `${rightPanelWidth}px` : '0px' }} className="flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 relative">
        {rightPanelVisible && (
          <div onMouseDown={(e) => {
            const startX = e.clientX; const startWidth = rightPanelWidth;
            const move = (me: MouseEvent) => setRightPanelWidth(Math.max(280, startWidth - (me.clientX - startX)));
            const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
            window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
          }} className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-50 transition-colors" />
        )}
        <ChatPanel history={project.chatHistory} onSendMessage={handleSendMessage} onClearMemory={() => setProject(p => ({ ...p, chatHistory: [] }))} onStopProcessing={() => setIsProcessing(false)} isProcessing={isProcessing} selectedModelId={project.selectedModelId} availableModels={PREDEFINED_MODELS} onModelChange={(id) => setProject(p => ({ ...p, selectedModelId: id }))} onToggleCollapse={() => setRightPanelVisible(false)} onEditMessage={() => {}} />
      </aside>
    </div>
  );
};

export default App;
