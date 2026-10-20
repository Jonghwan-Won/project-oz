import assert from 'node:assert/strict';

const base = process.env.GUIDE_TEST_URL || 'http://127.0.0.1:3000';
const page = await fetch(`${base}/guide`);
assert.equal(page.status, 200);
assert.match(await page.text(), /DEVELOPMENT GUIDE/);
const api = await fetch(`${base}/api/guide?check=api`);
assert.equal(api.status, 200);
assert.match(api.headers.get('cache-control'), /no-store/);
const body = await api.json();
assert.equal(body.ok, true);
assert.ok(Number.isFinite(Date.parse(body.serverTime)));
const invalid = await fetch(`${base}/api/guide?check=unknown`);
assert.equal(invalid.status, 400);
assert.equal((await invalid.json()).ok, false);
const db = await fetch(`${base}/api/guide?check=database`);
assert.ok([200, 503].includes(db.status));
const dbBody = await db.json();
assert.equal(dbBody.ok, db.status === 200);
assert.equal(typeof dbBody.message, 'string');
assert.deepEqual(Object.keys(dbBody).sort(), ['message', 'ok']);
console.log(
  `Guide smoke passed; DB check HTTP ${db.status} (200=connected, 503=not connected).`,
);
