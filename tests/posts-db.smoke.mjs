import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { loadPostModule } from './post-services.test.mjs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const api = loadPostModule('src/server/services/admin-posts.ts', pool);
const reads = loadPostModule('src/server/services/posts.ts', pool);
const { blankPost } = loadPostModule('src/lib/post-form.ts');
const slug = 'board-test-' + randomUUID();
let id;
try {
  assert.equal(
    (await pool.query('SELECT current_database() AS name')).rows[0].name,
    'oz_dev',
  );
  const draft = blankPost();
  draft.slug = slug;
  draft.translations.ko.title = '게시판 통합 검증';
  draft.translations.ko.body = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: '본문 검증' }] },
    ],
  };
  id = (await api.savePost(draft)).id;
  assert.equal(await reads.getPublicPost(id, 'ko'), null);
  let current = await reads.getAdminPost(id);
  assert.equal(current.translations.ko.title, draft.translations.ko.title);
  await api.savePost({ ...current, isVisible: true });
  assert.equal((await reads.getPublicPost(id, 'en')).contentLocale, 'ko');
  await assert.rejects(api.savePost(current), (e) => e.status === 409);
  current = await reads.getAdminPost(id);
  const invalid = structuredClone(current);
  invalid.translations.ko.body.content.push({
    type: 'image',
    attrs: { src: '/api/assets/' + randomUUID(), alt: 'missing' },
  });
  await assert.rejects(api.savePost(invalid), (e) => e.status === 400);
  assert.equal((await reads.getAdminPost(id)).version, current.version);
  const translated = structuredClone(current);
  translated.translations.en = {
    ...translated.translations.ko,
    title: 'Board integration check',
  };
  await api.savePost(translated);
  assert.equal(
    (await reads.getPublicPost(id, 'en')).title,
    translated.translations.en.title,
  );
  current = await reads.getAdminPost(id);
  await api.savePost({ ...current, isVisible: false });
  assert.equal(await reads.getPublicPost(id, 'ko'), null);
  current = await reads.getAdminPost(id);
  await api.deletePosts([{ id, version: current.version }]);
  assert.equal(
    (await reads.getAdminPosts()).some((p) => p.id === id),
    false,
  );
  assert.equal(await reads.getPublicPost(id, 'en'), null);
  assert.equal(
    (
      await pool.query(
        'SELECT count(*)::int AS count FROM "PostTranslation" WHERE "postId"=$1',
        [id],
      )
    ).rows[0].count,
    2,
  );
  console.log(
    'Real DB: create, edit, bilingual fallback, visibility, stale version, image validation, rollback and soft deletion passed.',
  );
} catch (error) {
  console.error('Board DB checks failed:', error.code ?? error.message);
  process.exitCode = 1;
} finally {
  if (id)
    await pool.query('DELETE FROM "Post" WHERE id=$1 AND slug=$2', [id, slug]);
  await pool.end();
}
