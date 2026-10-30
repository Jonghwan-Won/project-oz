import { logError, logEvent } from '@/server/logging';
import { requireAdmin } from '@/server/admin-access';
import { getAdminSession } from '@/server/auth';
import { hasSameOrigin } from '@/server/request-origin';
import 'server-only';
import { pool } from '@/server/db';
import {
  validInquiryUpdate,
  type InquiryCode,
  type InquiryRow,
  type emptyInquirySearch,
} from '@/lib/admin-inquiries';

export async function getPendingInquiryCount() {
  await requireAdmin();
  const result = await pool.query(
    'SELECT count(*)::int AS count FROM "Inquiry" WHERE "statusGroup"=$1 AND "statusCode"=$2',
    ['INQUIRY_STATUS', 'PENDING'],
  );
  return Number(result.rows[0].count);
}
export async function getAdminInquiries(search: typeof emptyInquirySearch) {
  await requireAdmin();
  const [items, types, statuses, count] = await Promise.all([
    pool.query<InquiryRow>(
      `SELECT i.id,i."typeCode",t."nameKo" AS "typeName",i."statusCode",s."nameKo" AS "statusName",i.body,to_char(i."createdAt" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",i."updatedAt"::text AS revision FROM "Inquiry" i JOIN "CommonCode" t ON t."groupKey"=i."typeGroup" AND t.code=i."typeCode" JOIN "CommonCode" s ON s."groupKey"=i."statusGroup" AND s.code=i."statusCode" WHERE ($1='' OR i."typeCode"=$1) AND ($2='' OR i."statusCode"=$2) AND position(lower($3) in lower(i.body))>0 ORDER BY i."createdAt" DESC,i.id`,
      [search.type, search.status, search.keyword.trim()],
    ),
    pool.query<InquiryCode>(
      'SELECT code,"nameKo" AS name,"isActive" FROM "CommonCode" WHERE "groupKey"=$1 ORDER BY position,code',
      ['INQUIRY_TYPE'],
    ),
    pool.query<InquiryCode>(
      'SELECT code,"nameKo" AS name,"isActive" FROM "CommonCode" WHERE "groupKey"=$1 ORDER BY position,code',
      ['INQUIRY_STATUS'],
    ),
    pool.query('SELECT count(*)::int AS total FROM "Inquiry"'),
  ]);
  return {
    inquiries: items.rows,
    types: types.rows,
    statuses: statuses.rows,
    total: Number(count.rows[0].total),
  };
}
export async function updateInquiryRequest(request: Request) {
  const json = (message: string, status: number) =>
    Response.json(
      { message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  if (!(await getAdminSession(request.headers)) || !hasSameOrigin(request))
    return json('관리자 로그인 후에만 변경할 수 있습니다.', 403);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json('입력을 확인해 주세요.', 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 4096) {
        await reader.cancel();
        return json('요청이 너무 큽니다.', 413);
      }
      chunks.push(part.value);
    }
    let input: unknown;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return json('입력 형식이 올바르지 않습니다.', 400);
    }
    if (!validInquiryUpdate(input)) return json('입력을 확인해 주세요.', 400);
    await requireAdmin();
    const result = await pool.query(
      `UPDATE "Inquiry" i SET "statusCode"=$2,"updatedAt"=now() WHERE i.id=$1 AND i."updatedAt"=$3::timestamptz AND EXISTS (SELECT 1 FROM "CommonCode" c WHERE c."groupKey"='INQUIRY_STATUS' AND c.code=$2 AND (c."isActive" OR c.code=i."statusCode")) RETURNING id`,
      [input.id, input.status, input.revision],
    );
    if (result.rowCount === 1)
      logEvent('info', 'admin.changed', {
        operation: 'inquiry.update',
        targetId: input.id,
        success: true,
      });
    return result.rowCount === 1
      ? json('저장되었습니다.', 200)
      : json(
          '상태가 변경되었거나 사용할 수 없는 상태입니다. 새로고침 후 확인해 주세요.',
          409,
        );
  } catch (error) {
    logError('inquiry.update', error);
    return json('상태를 저장하지 못했습니다.', 503);
  }
}
