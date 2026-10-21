import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { loadEnvFile } from 'node:process';
import { realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
loadEnvFile('.env.local');
assert.equal(new URL(process.env.DATABASE_URL).pathname, '/oz_dev');
const base = process.env.TEST_URL || 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const root = await realpath(process.env.STORAGE_ROOT);
assert.equal(path.basename(root), 'dev');
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);
let asset;
let projectId;
try {
  await client.connect();
  const denied = await fetch(base + '/api/assets', {
    method: 'POST',
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.equal(denied.status, 403);
  const form = new FormData();
  form.set('file', new File([png], '썸네일 확인.png', { type: 'image/png' }));
  const uploaded = await fetch(base + '/api/assets', {
    method: 'POST',
    headers: { Origin: base },
    body: form,
  });
  assert.equal(uploaded.status, 201, await uploaded.clone().text());
  asset = await uploaded.json();
  const preview = await fetch(base + asset.url);
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await preview.arrayBuffer()), png);
  const download = await fetch(base + asset.downloadUrl);
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /^attachment/);
  assert.ok(
    download.headers
      .get('content-disposition')
      .includes(encodeURIComponent('썸네일 확인.png')),
  );
  assert.equal((await fetch(base + '/api/assets/not-a-uuid')).status, 404);
  if (process.env.PUBLIC_TEST_URL) {
    const publicBase = process.env.PUBLIC_TEST_URL;
    assert.ok(
      ['localhost', '127.0.0.1'].includes(new URL(publicBase).hostname),
    );
    assert.equal(
      (
        await fetch(publicBase + '/api/assets', {
          method: 'POST',
          headers: { Origin: publicBase },
        })
      ).status,
      403,
    );
    assert.equal((await fetch(publicBase + asset.url)).status, 404);
    projectId = randomUUID();
    await client.query(
      'INSERT INTO "Project" (id,slug,"originCode",visibility,"updatedAt") VALUES ($1,$2,$3,$4,now())',
      [projectId, 'asset-test-' + projectId, 'personal', 'PRIVATE'],
    );
    await client.query(
      'INSERT INTO "ProjectAsset" (id,"projectId","assetId",usage) VALUES ($1,$2,$3,$4)',
      [randomUUID(), projectId, asset.id, 'ATTACHMENT'],
    );
    assert.equal((await fetch(publicBase + asset.url)).status, 404);
    await client.query('UPDATE "Project" SET visibility=$1 WHERE id=$2', [
      'PUBLIC',
      projectId,
    ]);
    const publicImage = await fetch(publicBase + asset.url);
    assert.equal(publicImage.status, 200);
    assert.deepEqual(Buffer.from(await publicImage.arrayBuffer()), png);
    await client.query('UPDATE "Project" SET visibility=$1 WHERE id=$2', [
      'PRIVATE',
      projectId,
    ]);
    assert.equal((await fetch(publicBase + asset.url)).status, 404);
    console.log(
      'Production upload denial and orphan/private/public/revoked file access checks passed.',
    );
  }
  console.log(
    'NAS upload, inline image, original-name download and origin/ID checks passed.',
  );
} finally {
  if (projectId)
    await client.query('DELETE FROM "Project" WHERE id=$1', [projectId]);
  if (asset) {
    const row = (
      await client.query('SELECT "storageKey" FROM "Asset" WHERE id=$1', [
        asset.id,
      ])
    ).rows[0];
    if (row) {
      const target = await realpath(path.join(root, row.storageKey));
      const relative = path.relative(root, target);
      assert.ok(
        relative && !relative.startsWith('..') && !path.isAbsolute(relative),
      );
      await client.query('DELETE FROM "Asset" WHERE id=$1', [asset.id]);
      await unlink(target);
    }
  }
  await client.end();
}
