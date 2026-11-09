import test from 'node:test';
import assert from 'node:assert/strict';
const { safeReturnPath, returnPathFromReferer } =
  await import('../src/lib/return-path.ts');

test('login returns only to internal pages', () => {
  assert.equal(safeReturnPath('/admin'), '/admin');
  assert.equal(safeReturnPath('/board?page=2#top'), '/board?page=2#top');
  for (const value of [
    undefined,
    '',
    'admin',
    'https://evil.example/',
    '//evil.example',
    '/\\evil.example',
    '/login',
    '/login?next=/admin',
    '/api/auth/sign-out',
    '/a b',
    '/' + 'x'.repeat(600),
  ])
    assert.equal(safeReturnPath(value), '/', String(value));
});

test('without next, a same-site referer is the previous page', () => {
  assert.equal(
    returnPathFromReferer(
      'http://localhost:3000/projects?category=work',
      'localhost:3000',
    ),
    '/projects?category=work',
  );
  assert.equal(
    returnPathFromReferer('https://evil.example/admin', 'localhost:3000'),
    '/',
  );
  assert.equal(
    returnPathFromReferer('http://localhost:3000/login', 'localhost:3000'),
    '/',
  );
  assert.equal(returnPathFromReferer(null, 'localhost:3000'), '/');
  assert.equal(returnPathFromReferer('not a url', 'localhost:3000'), '/');
});
