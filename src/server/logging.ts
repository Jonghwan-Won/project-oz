import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

type Context = { requestId: string; userId: string };
export const logContext = new AsyncLocalStorage<Context>();
type Fields = Record<string, string | number | boolean | undefined>;
let queue = Promise.resolve();
let pending = 0;
let cleanedDate = '';

// UTC filenames match DB timestamps; only this application's dated files expire.
async function expireFiles(root: string) {
  const cutoff = Date.now() - 30 * 86400000;
  for (const year of await readdir(root, { withFileTypes: true })) {
    if (!year.isDirectory() || !/^\d{4}$/.test(year.name)) continue;
    const yearPath = path.join(root, year.name);
    for (const month of await readdir(yearPath, { withFileTypes: true })) {
      if (!month.isDirectory() || !/^\d{2}$/.test(month.name)) continue;
      const monthPath = path.join(yearPath, month.name);
      for (const file of await readdir(monthPath, { withFileTypes: true })) {
        if (!file.isFile() || !/^oz_\d{4}-\d{2}-\d{2}\.jsonl$/.test(file.name))
          continue;
        const day = Date.parse(file.name.slice(3, 13) + 'T00:00:00Z');
        if (day + 86400000 <= cutoff)
          await unlink(path.join(monthPath, file.name));
      }
    }
  }
}

export function logEvent(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Fields = {},
) {
  const now = new Date();
  const line = JSON.stringify({
    ...fields,
    ...logContext.getStore(),
    time: now.toISOString(),
    level,
    event,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
  const root = process.env.LOG_ROOT;
  if (!root) return;
  if (pending >= 1000) {
    console.error('{"level":"error","event":"log.file_queue_full"}');
    return;
  }
  const date = now.toISOString().slice(0, 10);
  pending++;
  queue = queue
    .then(async () => {
      const directory = path.join(root, date.slice(0, 4), date.slice(5, 7));
      await mkdir(directory, { recursive: true });
      await appendFile(
        path.join(directory, 'oz_' + date + '.jsonl'),
        line + '\n',
        { mode: 0o600 },
      );
      if (cleanedDate !== date) {
        await expireFiles(root);
        cleanedDate = date;
      }
    })
    .catch(() => {
      console.error('{"level":"error","event":"log.file_write_failed"}');
    })
    .finally(() => {
      pending--;
    });
}

export function logError(operation: string, error: unknown) {
  const status =
    error && typeof error === 'object' && 'status' in error
      ? error.status
      : undefined;
  if (typeof status === 'number' && status < 500) return;
  const code =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Z0-9_]{1,40}$/.test(error.code)
      ? error.code
      : undefined;
  // Error messages and the first stack line can contain SQL values, paths or tokens.
  const frames =
    error instanceof Error
      ? error.stack
          ?.split('\n')
          .filter((line) => /^\s+at /.test(line))
          .slice(0, 8)
          .join('\n')
      : undefined;
  logEvent('error', 'operation.failed', {
    operation,
    code,
    errorType:
      error instanceof Error && /^[A-Za-z]{1,40}$/.test(error.name)
        ? error.name
        : 'Error',
    frames,
  });
}

export function setLogUser(userId: string) {
  const context = logContext.getStore();
  if (context) context.userId = userId;
}

export function withRequestLogging<T extends unknown[]>(
  route: string,
  handler: (request: Request, ...args: T) => Response | Promise<Response>,
) {
  return async (request: Request, ...args: T): Promise<Response> =>
    logContext.run(
      { requestId: randomUUID(), userId: 'anonymous' },
      async () => {
        const started = performance.now();
        logEvent('info', 'api.started', { method: request.method, route });
        try {
          const response = await handler(request, ...args);
          const headers = new Headers(response.headers);
          headers.set('X-Request-Id', logContext.getStore()!.requestId);
          const id = new URL(request.url).pathname.split('/').at(-1);
          logEvent(
            response.status >= 500
              ? 'error'
              : response.status >= 400
                ? 'warn'
                : 'info',
            'api.completed',
            {
              method: request.method,
              route,
              status: response.status,
              durationMs: Math.round(performance.now() - started),
              targetId: id && /^[0-9a-f-]{36}$/i.test(id) ? id : undefined,
            },
          );
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        } catch (error) {
          logError(route, error);
          logEvent('error', 'api.completed', {
            method: request.method,
            route,
            status: 500,
            durationMs: Math.round(performance.now() - started),
          });
          return Response.json(
            { message: '요청 처리에 실패했습니다.' },
            {
              status: 500,
              headers: {
                'Cache-Control': 'no-store',
                'X-Request-Id': logContext.getStore()!.requestId,
              },
            },
          );
        }
      },
    );
}

export async function flushLogs() {
  await queue;
}
