/** Persists the raw SQLite file: Tauri app data dir in the app, IndexedDB in a plain browser. */
export interface DbStorage {
  load(): Promise<Uint8Array | null>;
  save(bytes: Uint8Array): Promise<void>;
}

export const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function createStorage(): Promise<DbStorage> {
  return isTauri() ? tauriStorage() : idbStorage();
}

async function tauriStorage(): Promise<DbStorage> {
  const { appDataDir, join } = await import('@tauri-apps/api/path');
  const fs = await import('@tauri-apps/plugin-fs');
  const dir = await appDataDir();
  const file = await join(dir, 'cocktailcalc.db');
  return {
    async load() {
      if (!(await fs.exists(file))) return null;
      return fs.readFile(file);
    },
    async save(bytes) {
      if (!(await fs.exists(dir))) await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file, bytes);
    },
  };
}

function idbStorage(): DbStorage {
  const open = () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('cocktailcalc', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  const tx = async <T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>,
  ) => {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction('files', mode).objectStore('files'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };
  return {
    async load() {
      const v = await tx<Uint8Array | undefined>('readonly', (s) =>
        s.get('db'),
      );
      return v ?? null;
    },
    async save(bytes) {
      await tx('readwrite', (s) => s.put(bytes, 'db'));
    },
  };
}
