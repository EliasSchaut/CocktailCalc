import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { createCalcService, type CalcService } from '$lib/db/calc';
import { applyMigrations } from '$lib/db/migrations';
import * as schema from '$lib/db/schema';
import { createStorage, type DbStorage } from './storage';

export type LocalDb = { calc: CalcService; persist: () => Promise<void> };

let instance: Promise<LocalDb> | undefined;

/** The app's local database (sql.js in memory, persisted as a file after every change). */
export function getLocalDb(): Promise<LocalDb> {
  instance ??= open();
  return instance;
}

async function open(storage?: DbStorage): Promise<LocalDb> {
  storage ??= await createStorage();
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const bytes = await storage.load();
  const sqlite = bytes ? new SQL.Database(bytes) : new SQL.Database();
  const pragmas = () => sqlite.run('PRAGMA foreign_keys = ON');
  pragmas();
  const db = drizzle(sqlite, { schema });
  applyMigrations(db);

  const persist = async () => {
    // export() closes and reopens the handle internally, so pragmas must be re-applied
    const data = sqlite.export();
    pragmas();
    await storage!.save(data);
  };
  await persist();
  return { calc: createCalcService(db), persist };
}
