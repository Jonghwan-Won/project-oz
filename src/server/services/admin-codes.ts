import { requireAdmin } from '@/server/admin-access';
import { getAdminSession } from '@/server/auth';
import { hasSameOrigin } from '@/server/request-origin';
import 'server-only';
import { pool } from '@/server/db';
import type { CodeGroup, CodeItem } from '@/lib/common-codes';
import { validCodeInput } from '@/lib/common-codes';

export async function getAdminCodes() {
  await requireAdmin();
  const [groups, codes] = await Promise.all([
    pool.query<CodeGroup>(
      `SELECT key,"nameKo","nameEn",description,"isActive", "updatedAt"::text AS revision FROM "CommonCodeGroup" ORDER BY key`,
    ),
    pool.query<CodeItem>(
      `SELECT "groupKey",code,"nameKo","nameEn",position,"isActive", "updatedAt"::text AS revision FROM "CommonCode" ORDER BY "groupKey",position,code`,
    ),
  ]);
  return { groups: groups.rows, codes: codes.rows };
}

export async function saveCodeRequest(request: Request) {
  const response = (message: string, status: number) =>
    Response.json(
      { message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  if (
    !(await getAdminSession(request.headers)) ||
    !hasSameOrigin(request)
  )
    return response('관리자 로그인 후에만 변경할 수 있습니다.', 403);
  try {
    const reader = request.body?.getReader();
    if (!reader) return response('입력을 확인해 주세요.', 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 16384) {
        await reader.cancel();
        return response('입력이 너무 깁니다.', 413);
      }
      chunks.push(part.value);
    }
    let input: unknown;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return response('입력 형식이 올바르지 않습니다.', 400);
    }
    if (!validCodeInput(input))
      return response('코드와 이름 등 입력값을 확인해 주세요.', 400);
    const v = input;
    await requireAdmin();
    const values = [
      v.key,
      (v.nameKo as string).trim(),
      (v.nameEn as string).trim(),
      v.isActive,
    ];
    let result;
    if (v.kind === 'group') {
      result = v.isNew
        ? await pool.query(
            'INSERT INTO "CommonCodeGroup" (key,"nameKo","nameEn","isActive",description,"updatedAt") VALUES ($1,$2,$3,$4,$5,now())',
            [...values, v.description],
          )
        : await pool.query(
            'UPDATE "CommonCodeGroup" SET "nameKo"=$2,"nameEn"=$3,"isActive"=$4,description=$5,"updatedAt"=now() WHERE key=$1 AND "updatedAt"=$6::timestamptz',
            [...values, v.description, v.revision],
          );
    } else {
      result = v.isNew
        ? await pool.query(
            'INSERT INTO "CommonCode" (code,"nameKo","nameEn","isActive","groupKey",position,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,now())',
            [...values, v.groupKey, v.position],
          )
        : await pool.query(
            'UPDATE "CommonCode" SET "nameKo"=$2,"nameEn"=$3,"isActive"=$4,position=$6,"updatedAt"=now() WHERE code=$1 AND "groupKey"=$5 AND "updatedAt"=$7::timestamptz AND ("groupKey" <> \'TECHNOLOGY\' OR "nameKo"=$2 OR NOT EXISTS (SELECT 1 FROM "Tag" WHERE kind=\'TECHNOLOGY\' AND name="CommonCode"."nameKo"))',
            [...values, v.groupKey, v.position, v.revision],
          );
    }
    if (result.rowCount !== 1)
      return response(
        '다른 변경이 있거나 사용 중인 기술의 한글명을 변경하려고 했습니다. 새로고침 후 확인해 주세요.',
        409,
      );
    return response('저장되었습니다.', 200);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23505'
    )
      return response('이미 존재하는 코드입니다.', 409);
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23503'
    )
      return response('그룹이 존재하지 않습니다.', 400);
    return response('저장에 실패했습니다. 입력은 유지됩니다.', 503);
  }
}
