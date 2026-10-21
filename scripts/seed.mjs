import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import pg from 'pg';
import { seedDatabase } from './seed-data.mjs';
if (existsSync('.env.local')) loadEnvFile('.env.local');
const url = process.env.MIGRATION_DATABASE_URL;
if (!url)
  throw new Error(
    'MIGRATION_DATABASE_URL is required; use the migration owner, not the app account.',
  );
const client = new pg.Client({
  connectionString: url,
  connectionTimeoutMillis: 5000,
});
try {
  await client.connect();
  const inserted = await seedDatabase(client);
  console.log(
    `Seed complete: ${inserted} projects inserted; existing rows preserved.`,
  );
} catch (error) {
  console.error(
    `Seed failed (${error.code ?? 'UNKNOWN'}); credentials are omitted.`,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
