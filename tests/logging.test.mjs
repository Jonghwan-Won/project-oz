import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, overrides = {}, env = {}) {
  const output = ts.transpileModule(
    readFileSync(new URL('../src/server/' + file, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) =>
      id === 'server-only' ? {} : id in overrides ? overrides[id] : require(id),
    exports,
    { env },
  );
  return exports;
}
test('API logs redact secrets, link user and request IDs, persist daily files and expire only dated logs', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'oz-logs-'));
  try {
    await mkdir(path.join(root, '2000', '01'), { recursive: true });
    await writeFile(
      path.join(root, '2000', '01', 'oz_2000-01-01.jsonl'),
      'old',
    );
    await writeFile(path.join(root, '2000', '01', 'keep.txt'), 'keep');
    const api = load('logging.ts', {}, { LOG_ROOT: root });
    const handler = api.withRequestLogging('/api/auth/[...all]', async () => {
      api.setLogUser('admin-id');
      api.logError(
        'file.write',
        Object.assign(new Error('PRIVATE-PASSWORD'), { code: 'EACCES' }),
      );
      return new Response(null, { status: 201 });
    });
    const result = await handler(
      new Request('https://site/api/auth/SECRET-PATH?token=SECRET-TOKEN', {
        method: 'POST',
        headers: { cookie: 'SECRET-COOKIE' },
        body: 'SECRET-BODY',
      }),
    );
    assert.equal(result.status, 201);
    assert.ok(result.headers.get('x-request-id'));
    const failure = await api.withRequestLogging('/api/fail', async () => {
      throw Error('PRIVATE-PASSWORD');
    })(new Request('https://site/api/fail'));
    assert.equal(failure.status, 500);
    await api.flushLogs();
    const date = new Date().toISOString().slice(0, 10);
    const contents = await readFile(
      path.join(
        root,
        date.slice(0, 4),
        date.slice(5, 7),
        'oz_' + date + '.jsonl',
      ),
      'utf8',
    );
    assert.doesNotMatch(
      contents,
      /PRIVATE-PASSWORD|SECRET-PATH|SECRET-TOKEN|SECRET-COOKIE|SECRET-BODY/,
    );
    const logs = contents.trim().split('\n').map(JSON.parse);
    const completed = logs.find(
      (x) => x.event === 'api.completed' && x.status === 201,
    );
    assert.equal(completed.userId, 'admin-id');
    assert.equal(completed.requestId, result.headers.get('x-request-id'));
    assert.deepEqual(await readdir(path.join(root, '2000', '01')), [
      'keep.txt',
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('SQL logging preserves promise and callback behavior without printing SQL or values', async () => {
  const logs = [],
    errors = [];
  const { instrumentClient } = load('query-logging.ts', {
    '@/server/logging': {
      logContext: {
        getStore: () => ({ requestId: 'r' }),
        run: (_ctx, fn) => fn(),
      },
      logEvent: (...args) => logs.push(args),
      logError: (...args) => errors.push(args),
    },
  });
  const client = {
    query: (sql, params, callback) =>
      callback
        ? callback(null, { rowCount: 1 })
        : Promise.resolve({ rowCount: 1 }),
  };
  instrumentClient(client);
  assert.equal((await client.query('SELECT $1', ['SECRET-VALUE'])).rowCount, 1);
  await new Promise((resolve) =>
    client.query('SELECT $1', ['SECRET-VALUE'], (error, result) => {
      assert.equal(error, null);
      assert.equal(result.rowCount, 1);
      resolve();
    }),
  );
  const failure = Object.assign(Error('SECRET-DB-VALUE'), { code: '23505' });
  const broken = { query: () => Promise.reject(failure) };
  instrumentClient(broken);
  await assert.rejects(
    broken.query('INSERT SECRET-SQL'),
    (error) => error === failure,
  );
  assert.equal(logs.length, 3);
  assert.equal(logs[0][2].sqlId, logs[1][2].sqlId);
  assert.equal(errors.length, 1);
  assert.doesNotMatch(JSON.stringify(logs), /SECRET|SELECT|INSERT/);
});
