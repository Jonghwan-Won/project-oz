import 'server-only';
import pg from 'pg';
import { instrumentClient } from '@/server/query-logging';
import { logError } from '@/server/logging';
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000,
});

// Idle connections can close when the local SSH tunnel ends.
pool.on('connect', instrumentClient);
pool.on('error', (error) => logError('db.idle_connection', error));
