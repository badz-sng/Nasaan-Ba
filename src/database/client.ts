import * as SQLite from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'nasaanba.db';

let sqliteDb: SQLite.SQLiteDatabase | null = null;
let drizzleDb: ExpoSQLiteDatabase<typeof schema> | null = null;

export class DatabaseInitError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseInitError';
  }
}

/**
 * Opens (or creates) the local database, applies pending migrations, and
 * enables the PRAGMAs the schema depends on (foreign_keys, WAL).
 *
 * Call this once at app boot, before rendering any screen that touches
 * data — see app/_layout.tsx.
 */
export async function initDatabase(): Promise<ExpoSQLiteDatabase<typeof schema>> {
  if (drizzleDb) return drizzleDb;

  try {
    sqliteDb = await SQLite.openDatabaseAsync(DB_NAME);

    // Foreign keys are OFF by default per SQLite connection — must be set
    // every time the DB is opened, not just once at creation.
    await sqliteDb.execAsync('PRAGMA foreign_keys = ON;');
    await sqliteDb.execAsync('PRAGMA journal_mode = WAL;');

    drizzleDb = drizzle(sqliteDb, { schema });

    await runMigrations(sqliteDb);

    return drizzleDb;
  } catch (err) {
    // Fallback path: a corrupted DB file should not hard-crash the app.
    // Surface a typed error the UI layer can catch and turn into a
    // "Reset local database" recovery screen instead of a white screen.
    throw new DatabaseInitError(
      'Could not open or migrate the local database. The file may be corrupted.',
      err
    );
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // MVP approach: a simple version-tracked runner. Once the project has
  // more than a handful of migrations, swap this for drizzle's generated
  // `migrate()` helper (drizzle-orm/expo-sqlite/migrator) fed by
  // drizzle-kit's output — this hand-rolled version is deliberately
  // simple for the first migration only.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS __migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (current_timestamp)
    );
  `);

  const applied = await db.getAllAsync<{ name: string }>('SELECT name FROM __migrations');
  const appliedNames = new Set(applied.map((r) => r.name));

  const { sql: initialSql } = await import('./migrations/0000_initial');
  const { sql: ftsSyncSql } = await import('./migrations/0001_fts_sync');
  const migrations = [
    { name: '0000_initial', sql: initialSql },
    { name: '0001_fts_sync', sql: ftsSyncSql },
  ];

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) continue;

    try {
      await db.execAsync(migration.sql);
      await db.runAsync('INSERT INTO __migrations (name) VALUES (?)', migration.name);
    } catch (err) {
      throw new DatabaseInitError(`Migration "${migration.name}" failed`, err);
    }
  }
}

/** For recovery flows only — wipes the local DB file. Confirm with the
 *  user before calling this; there is no undo. */
export async function resetDatabase(): Promise<void> {
  if (sqliteDb) {
    await sqliteDb.closeAsync();
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
  sqliteDb = null;
  drizzleDb = null;
}

export function getDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!drizzleDb) {
    throw new DatabaseInitError('Database accessed before initDatabase() completed.');
  }
  return drizzleDb;
}
