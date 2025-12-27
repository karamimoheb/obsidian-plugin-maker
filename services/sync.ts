
import { FileEntry } from "../types";

export interface SyncProgress {
  status: 'idle' | 'scanning' | 'syncing' | 'completed' | 'error';
  percentage: number;
  currentFile: string;
  message?: string;
}

/**
 * Recursively scan local directory and extract file structure
 */
export async function scanLocalDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path: string = ""
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];
  
  for await (const entry of (directoryHandle as any).values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      const content = await file.text();
      files.push({
        name: entry.name,
        path: entryPath,
        type: 'file',
        content: content
      });
    } else if (entry.kind === 'directory') {
      const subFiles = await scanLocalDirectory(entry, entryPath);
      files.push(...subFiles);
    }
  }
  
  return files;
}

/**
 * Incremental reconciliation
 * Identifies only changed or new files
 */
export function reconcileFiles(
  projectFiles: FileEntry[],
  localFiles: FileEntry[]
): { updatedFiles: FileEntry[], hasChanges: boolean } {
  let hasChanges = false;
  const newProjectFiles = [...projectFiles];
  
  localFiles.forEach(localFile => {
    const existingIndex = newProjectFiles.findIndex(f => f.path === localFile.path);
    
    if (existingIndex > -1) {
      if (newProjectFiles[existingIndex].content !== localFile.content) {
        newProjectFiles[existingIndex] = { ...localFile };
        hasChanges = true;
      }
    } else {
      newProjectFiles.push(localFile);
      hasChanges = true;
    }
  });
  
  return { updatedFiles: newProjectFiles, hasChanges };
}

/**
 * Save a single file to local system
 */
export async function saveFileToLocal(
  directoryHandle: FileSystemDirectoryHandle,
  file: FileEntry
): Promise<void> {
  const pathParts = file.path.split('/');
  let currentDir = directoryHandle;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    currentDir = await currentDir.getDirectoryHandle(pathParts[i], { create: true });
  }
  
  const fileName = pathParts[pathParts.length - 1];
  const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file.content);
  await writable.close();
}
