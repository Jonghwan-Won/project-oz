import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function load(admin, fs) {
  const output = ts.transpileModule(
    readFileSync('src/server/services/guide-documents.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports = {};
  const imports = {
    'server-only': {},
    'node:fs/promises': fs,
    'node:path': path,
    'next/headers': { headers: async () => new Headers() },
    '@/server/auth': { getAdminSession: async () => (admin ? {} : null) },
  };
  new Function('require', 'exports', output)((name) => imports[name], exports);
  return exports.getGuideDocuments;
}

test('visitors never read server documents', async () => {
  const get = load(false, {
    readdir: () => assert.fail('private filesystem read'),
    readFile: () => assert.fail('private file read'),
  });
  assert.deepEqual(await get(), []);
});

test('a runtime without optional docs still allows the Markdown viewer', async () => {
  const get = load(true, {
    readdir: async () => {
      throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    },
    readFile: () => assert.fail('README must not be read without docs'),
  });
  assert.deepEqual(await get(), []);
});

test('unexpected filesystem errors remain visible', async () => {
  const error = Object.assign(new Error('denied'), { code: 'EACCES' });
  const get = load(true, {
    readdir: async () => {
      throw error;
    },
  });
  await assert.rejects(get, (caught) => caught === error);
});

test('admins receive README and only numbered top-level Markdown documents', async () => {
  const get = load(true, {
    readdir: async () =>
      [
        ['02-구조.md', true],
        ['posts', false],
        ['private.md', true],
        ['01-요구사항.md', true],
        ['03-폴더.md', false],
      ].map(([name, file]) => ({ name, isFile: () => file })),
    readFile: async (file) => path.basename(file),
  });
  assert.deepEqual(
    (await get()).map((doc) => doc.name),
    ['README.md', 'docs/01-요구사항.md', 'docs/02-구조.md'],
  );
});
