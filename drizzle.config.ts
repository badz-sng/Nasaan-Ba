import type { Config } from 'drizzle-kit';

// NOTE: Used only for `drizzle-kit generate` (dev tooling on your machine).
// At runtime on-device, migrations are applied via expo-sqlite's
// `openDatabaseSync` + drizzle's `migrate()` — see src/database/client.ts.
export default {
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
