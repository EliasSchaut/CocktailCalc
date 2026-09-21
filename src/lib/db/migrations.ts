import { sql } from 'drizzle-orm';
import journal from '../../../drizzle/meta/_journal.json';
import type { Db } from './calc.ts';

// All migration files are bundled so the app can migrate its local database.
const files = import.meta.glob('../../../drizzle/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Applies pending migrations from `drizzle/` to a synchronous Drizzle database.
 * Used by the app (sql.js); the server uses drizzle's own migrator.
 */
export function applyMigrations(db: Db) {
  db.run(
    sql`create table if not exists app_migrations (tag text primary key, applied_at text not null)`,
  );
  const applied = new Set(
    db
      .all<{ tag: string }>(sql`select tag from app_migrations`)
      .map((r) => r.tag),
  );
  for (const entry of journal.entries) {
    if (applied.has(entry.tag)) continue;
    const content = files[`../../../drizzle/${entry.tag}.sql`];
    if (!content)
      throw new Error(`migration file for ${entry.tag} not bundled`);
    db.transaction(() => {
      for (const stmt of content.split('--> statement-breakpoint')) {
        if (stmt.trim()) db.run(sql.raw(stmt));
      }
      db.run(
        sql`insert into app_migrations (tag, applied_at) values (${entry.tag}, ${new Date().toISOString()})`,
      );
    });
  }
}
