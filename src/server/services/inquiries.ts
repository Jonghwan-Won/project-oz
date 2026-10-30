import { logError } from '@/server/logging';
import 'server-only';
import { randomUUID } from 'node:crypto';
import { pool } from '@/server/db';
import { hasSameOrigin } from '@/server/request-origin';

export async function submitInquiry(request: Request) {
  const response = (status: number) =>
    Response.json({}, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!hasSameOrigin(request)) return response(403);
  const reader = request.body?.getReader();
  if (!reader) return response(400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 24000) {
        await reader.cancel();
        return response(413);
      }
      chunks.push(part.value);
    }
    const input: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (
      !input ||
      typeof input !== 'object' ||
      !('type' in input) ||
      !('body' in input) ||
      (input.type !== 'BUG_REPORT' && input.type !== 'GENERAL') ||
      typeof input.body !== 'string' ||
      !input.body.trim() ||
      input.body.length > 4000
    )
      return response(400);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO "Inquiry" (id, "typeCode", body) VALUES ($1, $2, $3)',
        [randomUUID(), input.type, input.body.trim()],
      );
      await client.query('COMMIT');
    } catch (error) {
      logError('inquiries', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return response(201);
  } catch (error) {
    logError('inquiries', error);
    return response(error instanceof SyntaxError ? 400 : 503);
  }
}
