
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
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'todo' | 'completed' | 'suggestion';
  description?: string;
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
  issues?: ProjectIssue[];
  tasks?: ProjectTask[];
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  timestamp: number;
  files: FileEntry[];
  activeFilePath: string | null;
}
