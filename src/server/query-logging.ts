import 'server-only';
import { createHash } from 'node:crypto';
import type pg from 'pg';
import { logContext, logError, logEvent } from '@/server/logging';

export function instrumentClient(client: pg.PoolClient) {
  client.query = new Proxy(client.query, {
    apply(target, thisArg, args: unknown[]) {
      const input = args[0];
      const text =
        typeof input === 'string'
          ? input
          : input &&
              typeof input === 'object' &&
              'text' in input &&
              typeof input.text === 'string'
            ? input.text
            : 'query';
      const operation =
        text
          .trim()
          .match(
            /^(SELECT|INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK|WITH)\b/i,
          )?.[0]
          .toLowerCase() ?? 'query';
      const sqlId =
        operation +
        '.' +
        createHash('sha256').update(text).digest('hex').slice(0, 12);
      const started = performance.now();
      const context = logContext.getStore();
      const finish = (error?: unknown) =>
        logContext.run(context!, () => {
          const durationMs = Math.round(performance.now() - started);
          logEvent(
            error ? 'error' : durationMs >= 1000 ? 'warn' : 'info',
            'sql.completed',
            { sqlId, durationMs, success: !error, slow: durationMs >= 1000 },
          );
          if (error) logError(sqlId, error);
        });
      const callback = args.at(-1);
      if (typeof callback === 'function') {
        args[args.length - 1] = function (this: unknown, ...values: unknown[]) {
          finish(values[0]);
          return Reflect.apply(callback, this, values);
        };
      }
      try {
        const result = Reflect.apply(target, thisArg, args);
        if (typeof callback !== 'function' && result instanceof Promise) {
          return result.then(
            (value) => {
              finish();
              return value;
            },
            (error) => {
              finish(error);
              throw error;
            },
          );
        }
        return result;
      } catch (error) {
        finish(error);
        throw error;
      }
    },
  });
}
