
export interface AIModelConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  provider?: 'gemini' | 'openrouter' | 'custom';
}

export interface FileEntry {
  name: string;
  content: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileEntry[];
}

export interface ChatAttachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
}

export interface ProjectIssue {
  id: string;
  errorLog: string;
  description?: string;
  status: 'open' | 'analyzing' | 'researching' | 'fixing' | 'resolved';
  timestamp: number;
  analysis?: string;
  // Learning & Knowledge Base fields
  errorType?: 'runtime' | 'build' | 'type' | 'config';
  rootCause?: string;
  resolution?: string;
  affectedFiles?: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'todo' | 'completed' | 'suggestion';
  description?: string;
}

export type LearningStepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface LearningStep {
  id: string; 
  title: string;
  status: LearningStepStatus;
  description: string;
  result?: string;
  errorMessage?: string;
}

export interface LearningSession {
  sessionId?: string;
  pluginId?: string;
  isActive: boolean;
  currentStep: number;
  steps: LearningStep[];
  isPaused: boolean;
  isZipImported: boolean;
  backupFiles?: FileEntry[]; // Stores state before learning
  backupActiveFilePath?: string | null;
  outputs?: {
    learningNotesUrl?: string;
    pluginRulesUrl?: string;
    learningNotesContent?: string;
    pluginRulesContent?: string;
  };
}

export interface ProjectState {
  files: FileEntry[];
  activeFilePath: string | null;
  selectedModelId: string;
  models: AIModelConfig[];
  chatHistory: ChatMessage[];
  changedFilePaths?: string[]; 
  theme?: 'dark' | 'light';
  isSynced?: boolean;
  lastSyncTime?: number;
  // Fix: Removed trailing '?' which is invalid syntax and added '[]' to match array usage in the app
  issues?: ProjectIssue[];
  tasks?: ProjectTask[];
  learningSession?: LearningSession;
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  timestamp: number;
  files: FileEntry[];
  activeFilePath: string | null;
}
