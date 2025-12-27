
import { FileEntry } from "../types";

/**
 * Recursively scan local directory and extract file structure
 * Skips heavy/binary folders to ensure web performance
 */
export async function scanLocalDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path: string = ""
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];
  const SKIP_FOLDERS = ['node_modules', '.git', '.obsidian', 'dist', 'build'];
  const SKIP_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.exe'];

  try {
    // @ts-ignore - entries() is part of the File System Access API
    for await (const entry of directoryHandle.values()) {
      if (SKIP_FOLDERS.includes(entry.name)) continue;

      const entryPath = path ? `${path}/${entry.name}` : entry.name;
      
      // Fix: Cast entry to FileSystemFileHandle when kind is 'file' to access getFile() method
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const isBinary = SKIP_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext));
        if (isBinary) continue;

        const file = await fileHandle.getFile();
        const content = await file.text();
        files.push({
          name: entry.name,
          path: entryPath,
          type: 'file',
          content: content
        });
      } else if (entry.kind === 'directory') {
        // Fix: Cast entry to FileSystemDirectoryHandle when kind is 'directory' for the recursive call
        const dirHandle = entry as FileSystemDirectoryHandle;
        const subFiles = await scanLocalDirectory(dirHandle, entryPath);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory at ${path}:`, error);
    throw error;
  }
  
  return files;
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
  // @ts-ignore
  const writable = await fileHandle.createWritable();
  await writable.write(file.content);
  await writable.close();
}
