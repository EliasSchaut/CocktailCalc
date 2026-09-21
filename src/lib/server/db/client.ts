import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.ts';

export type Db = ReturnType<typeof createDb>;

/**
 * Opens (and creates if needed) a SQLite database and applies pending migrations.
 * Free of any SvelteKit imports so it can be used from scripts and tests as well.
 */
export function createDb(path: string, migrationsFolder = 'drizzle') {
  const sqlite = new Database(path.replace(/^file:/, ''));
  sqlite.pragma('foreign_keys = ON');
  if (path !== ':memory:') sqlite.pragma('journal_mode = WAL');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  return db;
}
