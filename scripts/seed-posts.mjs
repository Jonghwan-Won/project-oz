import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { posts } from '../src/content/site.ts';
if (existsSync('.env.local')) loadEnvFile('.env.local');
const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
try {
  if (!process.env.MIGRATION_DATABASE_URL)
    throw Error('Migration account required');
  await client.connect();
  if (
    (await client.query('SELECT current_database() AS name')).rows[0].name !==
    'oz_dev'
  )
    throw Error('Development database required');
  await client.query('BEGIN');
  let inserted = 0;
  for (const post of posts) {
    const id = randomUUID();
    const result = await client.query(
      'INSERT INTO "Post" (id,slug,category,"isVisible","createdAt") VALUES ($1,$2,$3,true,$4::timestamptz) ON CONFLICT (slug) DO NOTHING RETURNING id',
      [
        id,
        post.slug,
        post.category,
        post.date.replaceAll('.', '-') + 'T00:00:00+09:00',
      ],
    );
    if (!result.rowCount) continue;
    const body = {
      type: 'doc',
      content: post.paragraphs.map((text) => ({
        type: 'paragraph',
        content: [{ type: 'text', text }],
      })),
    };
    await client.query(
      'INSERT INTO "PostTranslation" ("postId",locale,title,summary,body) VALUES ($1,\'ko\',$2,$3,$4::jsonb)',
      [id, post.title, post.excerpt, JSON.stringify(body)],
    );
    inserted++;
  }
  await client.query('COMMIT');
  console.log(`Imported ${inserted} posts; existing posts preserved.`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(
    `Post import failed (${error.code ?? 'UNKNOWN'}); credentials omitted.`,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
