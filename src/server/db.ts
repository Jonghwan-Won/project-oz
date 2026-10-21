import 'server-only';
import pg from 'pg';
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000,
});

// Idle connections can close when the local SSH tunnel ends.
pool.on('error', () =>
  console.error('An idle database connection was closed.'),
);
