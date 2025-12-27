
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
import { Sun, Moon, Loader2, Menu, MessageSquare, AlertCircle, X, History, Bug, ClipboardList, ShieldAlert, BrainCircuit } from 'lucide-react';

const PREDEFINED_MODELS: AIModelConfig[] = [
  { id: '3pro', name: 'Gemini 3 Pro', baseUrl: '', apiKey: '', modelName: 'gemini-3-pro-preview', provider: 'gemini' },
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
    selectedModelId: '3pro',
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const [showSnapshotManager, setShowSnapshotManager] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showLearningMode, setShowLearningMode] = useState(false);
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
            learningSession: saved.learningSession || prev.learningSession
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

  const handleImportZip = (importedFiles: FileEntry[]) => {
    if (!importedFiles.length) return;
    setProject(prev => ({
      ...prev,
      files: importedFiles,
      activeFilePath: importedFiles[0].path,
      learningSession: {
        ...prev.learningSession!,
        isZipImported: true,
        isActive: false,
        currentStep: 0,
        steps: INITIAL_LEARNING_STEPS,
        outputs: {}
      }
    }));
  };

  const executeLearningLoop = async (stepIdx: number) => {
    if (stepIdx >= INITIAL_LEARNING_STEPS.length) {
      setProject(prev => ({ ...prev, learningSession: { ...prev.learningSession!, isActive: false } }));
      return;
    }

    setProject(prev => ({
      ...prev,
      learningSession: {
        ...prev.learningSession!,
        currentStep: stepIdx,
        steps: prev.learningSession!.steps.map((s, i) => i === stepIdx ? { ...s, status: 'active' as const } : s)
      }
    }));

    setIsProcessing(true);
    try {
      const activeModel = PREDEFINED_MODELS.find(m => m.id === project.selectedModelId) || PREDEFINED_MODELS[0];
      const previousFindings = project.learningSession!.steps.slice(0, stepIdx).map(s => `${s.title}: ${s.result}`).join('\n\n');
      const response = await processLearningStep(stepIdx, INITIAL_LEARNING_STEPS[stepIdx].title, project.files, previousFindings, activeModel.modelName);
      
      const newFiles = [...project.files];
      let notes = project.learningSession?.outputs?.learningNotesContent;
      let rules = project.learningSession?.outputs?.pluginRulesContent;

      if (response.generatedFiles) {
        response.generatedFiles.forEach((gen: any) => {
          const idx = newFiles.findIndex(f => f.path === gen.path);
          if (idx > -1) newFiles[idx].content = gen.content;
          else newFiles.push({ name: gen.path, path: gen.path, type: 'file', content: gen.content });
          if (gen.path === 'LEARNING_NOTES.md') notes = gen.content;
          if (gen.path === 'PLUGIN_RULES.md') rules = gen.content;
        });
      }

      setProject(prev => ({
        ...prev,
        files: newFiles,
        learningSession: {
          ...prev.learningSession!,
          steps: prev.learningSession!.steps.map((s, i) => i === stepIdx ? { ...s, status: 'completed' as const, result: response.resultMarkdown } : s),
          outputs: { ...prev.learningSession?.outputs, learningNotesContent: notes, pluginRulesContent: rules }
        }
      }));
      setTimeout(() => executeLearningLoop(stepIdx + 1), 500);
    } catch (e: any) {
      setProject(prev => ({
        ...prev,
        learningSession: {
          ...prev.learningSession!,
          steps: prev.learningSession!.steps.map((s, i) => i === stepIdx ? { ...s, status: 'error' as const, errorMessage: e.message } : s),
          isActive: false
        }
      }));
    } finally { setIsProcessing(false); }
  };

  const handleSendMessage = async (message: string, attachments: ChatAttachment[]) => {
    const activeModel = PREDEFINED_MODELS.find(m => m.id === project.selectedModelId) || PREDEFINED_MODELS[0];
    setProject(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'user', content: message, timestamp: Date.now(), attachments }], changedFilePaths: [] }));
    setIsProcessing(true);
    abortControllerRef.current = new AbortController();
    try {
      const response = await processArchitectRequest(message, project.files, project.chatHistory, activeModel.modelName, attachments, issues.filter(i => i.status !== 'resolved'), project.tasks || []);
      const newFiles = [...project.files];
      response.files.forEach((nf: any) => {
        const idx = newFiles.findIndex(f => f.path === nf.path);
        if (idx > -1) newFiles[idx].content = nf.content;
        else newFiles.push({ name: nf.path.split('/').pop() || nf.path, path: nf.path, type: 'file', content: nf.content });
      });
      setProject(prev => ({ ...prev, files: newFiles, chatHistory: [...prev.chatHistory, { role: 'assistant', content: response.chatMessage, timestamp: Date.now() }], tasks: response.tasks || prev.tasks }));
    } catch (error: any) {
      setProject(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'system', content: `Error: ${error.message}`, timestamp: Date.now() }] }));
    } finally { setIsProcessing(false); abortControllerRef.current = null; }
  };

  const handleAddIssue = async (log: string) => {
    const issueId = Math.random().toString(36).substring(2, 11);
    setIssues(prev => [...prev, { id: issueId, errorLog: log, status: 'analyzing', timestamp: Date.now() }]);
    setIsProcessing(true);
    try {
      const activeModel = PREDEFINED_MODELS.find(m => m.id === project.selectedModelId) || PREDEFINED_MODELS[0];
      const analysis = await processDebugRequest(log, project.files, issues.filter(i => i.status === 'resolved'), activeModel.modelName);
      const updatedIssue: ProjectIssue = { id: issueId, errorLog: log, timestamp: Date.now(), status: 'resolved', analysis: analysis.explanation, errorType: analysis.errorType, rootCause: analysis.rootCause, resolution: analysis.resolution };
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
    } catch (e: any) { setErrorMessage("Debug Fix Failed: " + e.message); } finally { setIsProcessing(false); }
  };

  const handleSaveSnapshot = async (name: string) => {
    const newSnap: ProjectSnapshot = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      timestamp: Date.now(),
      files: [...project.files],
      activeFilePath: project.activeFilePath
    };
    await saveSnapshot(newSnap);
    setSnapshots(prev => [...prev, newSnap]);
  };

  const handleRestoreSnapshot = (snapshot: ProjectSnapshot) => {
    setProject(prev => ({
      ...prev,
      files: snapshot.files,
      activeFilePath: snapshot.activeFilePath
    }));
    setShowSnapshotManager(false);
  };

  const handleDeleteSnapshot = async (id: string) => {
    await deleteSnapshot(id);
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', project.theme === 'dark');
    if (!isInitialLoad) saveProject(project).catch(console.error);
  }, [project, isInitialLoad]);

  if (isInitialLoad) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-blue-500"><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
      {showLearningMode && project.learningSession && (
        <LearningModePanel 
          session={project.learningSession} 
          onClose={() => setShowLearningMode(false)}
          onStart={() => { setProject(p => ({ ...p, learningSession: { ...p.learningSession!, isActive: true, currentStep: 0, steps: INITIAL_LEARNING_STEPS } })); executeLearningLoop(0); }}
          onPauseToggle={() => setProject(p => ({ ...p, learningSession: { ...p.learningSession!, isPaused: !p.learningSession!.isPaused } }))}
          isProcessing={isProcessing}
          onDownloadNotes={() => { const b = new Blob([project.learningSession?.outputs?.learningNotesContent || ''], { type: 'text/markdown' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = 'LEARNING_NOTES.md'; l.click(); }}
          onDownloadRules={() => { const b = new Blob([project.learningSession?.outputs?.pluginRulesContent || ''], { type: 'text/markdown' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = 'PLUGIN_RULES.md'; l.click(); }}
        />
      )}

      {showSnapshotManager && (
        <SnapshotManager 
          snapshots={snapshots} 
          onClose={() => setShowSnapshotManager(false)} 
          onRestore={handleRestoreSnapshot} 
          onSave={handleSaveSnapshot} 
          onDelete={handleDeleteSnapshot} 
        />
      )}

      {showDebugConsole && <DebugConsole issues={issues} isProcessing={isProcessing} onClose={() => setShowDebugConsole(false)} onAddIssue={handleAddIssue} onUpdateStatus={(id, s) => setIssues(p => p.map(i => i.id === id ? {...i, status: s} : i))} onDeleteIssue={(id) => deleteIssue(id).then(() => setIssues(p => p.filter(x => x.id !== id)))} />}
      {showRoadmap && <RoadmapManager tasks={project.tasks || []} onClose={() => setShowRoadmap(false)} onExecuteTask={(t) => { setShowRoadmap(false); handleSendMessage(t, []); }} />}

      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-lg bg-red-600 text-white p-4 rounded-2xl flex items-start gap-3 shadow-2xl">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div className="flex-1 text-xs"><b>System Alert</b><p>{errorMessage}</p></div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={18} /></button>
        </div>
      )}

      <aside style={{ width: leftPanelVisible ? '260px' : '0px' }} className="flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 overflow-hidden">
        <FileTree files={project.files} activeFile={project.activeFilePath} changedFilePaths={project.changedFilePaths || []} onSelect={(path) => setProject(p => ({ ...p, activeFilePath: path }))} onSync={() => {}} onDownload={() => {}} onToggleCollapse={() => setLeftPanelVisible(false)} onAddFile={(name) => setProject(p => ({ ...p, files: [...p.files, { name, path: name, content: '', type: 'file' }], activeFilePath: name }))} onDeleteFile={(path) => setProject(p => ({ ...p, files: p.files.filter(f => f.path !== path), activeFilePath: p.activeFilePath === path ? 'README.md' : p.activeFilePath }))} onImportZip={handleImportZip} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {!leftPanelVisible && <button onClick={() => setLeftPanelVisible(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><Menu size={20} /></button>}
            <h1 className="text-sm font-bold tracking-tight">Architect IDE</h1>
          </div>
          <div className="flex items-center gap-2">
            {project.learningSession?.isZipImported && (
              <button onClick={() => setShowLearningMode(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-blue-600/10 text-blue-500 border border-blue-500/30">
                <BrainCircuit size={16} /> <span className="hidden sm:inline">Learning Mode</span>
              </button>
            )}
            <button onClick={() => setShowRoadmap(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500" title="Roadmap"><ClipboardList size={18} /></button>
            <button onClick={() => setShowSnapshotManager(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500" title="History"><History size={18} /></button>
            <button onClick={() => setShowDebugConsole(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 relative" title="Debug Center"><Bug size={18} />{issues.some(i => i.status !== 'resolved') && <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse" />}</button>
            <button onClick={() => setProject(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500">{project.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            {!rightPanelVisible && <button onClick={() => setRightPanelVisible(true)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><MessageSquare size={18} /></button>}
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <CodeEditor content={project.files.find(f => f.path === project.activeFilePath)?.content || ''} fileName={project.activeFilePath?.split('/').pop() || ''} isProcessing={isProcessing} onChange={(val) => setProject(prev => ({...prev, files: prev.files.map(f => f.path === project.activeFilePath ? {...f, content: val} : f)}))} onBuildFromPlan={() => handleSendMessage("Build plugin from plan", [])} />
        </div>
      </main>

      <aside style={{ width: rightPanelVisible ? `${rightPanelWidth}px` : '0px' }} className="flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 relative">
        {rightPanelVisible && (
          <div onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = rightPanelWidth;
            const move = (me: MouseEvent) => setRightPanelWidth(Math.max(280, startWidth - (me.clientX - startX)));
            const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }} className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-50 transition-colors" />
        )}
        <ChatPanel history={project.chatHistory} onSendMessage={handleSendMessage} onClearMemory={() => setProject(p => ({ ...p, chatHistory: [] }))} onStopProcessing={() => setIsProcessing(false)} isProcessing={isProcessing} selectedModelId={project.selectedModelId} availableModels={PREDEFINED_MODELS} onModelChange={(id) => setProject(p => ({ ...p, selectedModelId: id }))} onToggleCollapse={() => setRightPanelVisible(false)} onEditMessage={() => {}} learningSession={project.learningSession} onToggleLearningMode={() => project.learningSession?.isZipImported && setShowLearningMode(true)} />
      </aside>
    </div>
  );
};

export default App;
