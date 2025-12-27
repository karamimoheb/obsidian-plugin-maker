
import { ProjectState, ProjectSnapshot, ProjectIssue } from '../types';

const DB_NAME = 'ObsidianArchitectDB';
const STORE_NAME = 'ProjectState';
const SNAPSHOT_STORE = 'Snapshots';
const ISSUE_STORE = 'Issues';
const DB_VERSION = 3; // Incremented version for new store

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ISSUE_STORE)) {
        db.createObjectStore(ISSUE_STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function saveProject(state: ProjectState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(state, 'current');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadProject(): Promise<ProjectState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('current');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSnapshot(snapshot: ProjectSnapshot): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore(SNAPSHOT_STORE).put(snapshot);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSnapshots(): Promise<ProjectSnapshot[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const request = tx.objectStore(SNAPSHOT_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore(SNAPSHOT_STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveIssue(issue: ProjectIssue): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(ISSUE_STORE, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore(ISSUE_STORE).put(issue);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getIssues(): Promise<ProjectIssue[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ISSUE_STORE, 'readonly');
    const request = tx.objectStore(ISSUE_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteIssue(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(ISSUE_STORE, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore(ISSUE_STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
