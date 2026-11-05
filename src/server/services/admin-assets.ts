import { logError, logEvent } from '@/server/logging';
import { requireAdmin } from '@/server/admin-access';
import { getAdminSession } from '@/server/auth';
import { hasSameOrigin } from '@/server/request-origin';
import 'server-only';
import { randomUUID } from 'node:crypto';
import { realpath, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '@/server/db';
import {
  assetIdsValid,
  emptyAssetSearch,
  type AdminAsset,
} from '@/lib/admin-assets';

export async function getUnusedAssetSummary() {
  await requireAdmin();
  const result = await pool.query(
    `SELECT count(*)::int AS count,COALESCE(sum(a."byteSize"),0)::float8 AS size FROM "Asset" a WHERE NOT EXISTS (SELECT 1 FROM "ProjectAsset" WHERE "assetId"=a.id) AND NOT EXISTS (SELECT 1 FROM "PostAsset" WHERE "assetId"=a.id)`,
  );
  return result.rows[0] as { count: number; size: number };
}
export async function getAdminAssets(
  search = emptyAssetSearch,
  publicOnly = false,
) {
  if (!publicOnly) await requireAdmin();
  if (publicOnly && !process.env.DATABASE_URL)
    return {
      assets: [],
      totals: { total: 0, size: 0, unused: 0, unusedSize: 0 },
    };
  const [result, totals] = await Promise.all([
    pool.query<AdminAsset>(
      `SELECT a.id,${publicOnly ? "'비공개 파일명'" : 'a."originalName"'} AS name,a."byteSize"::float8 AS size,to_char(a."createdAt" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
    COALESCE((SELECT jsonb_agg(u) FROM (
      SELECT 'project' AS type,${publicOnly ? 'NULL::text' : 'p.id::text'} AS id,${publicOnly ? "'프로젝트'" : 'COALESCE(t.title,p.slug)'} AS title,pa.usage::text AS usage,(p."deletedAt" IS NOT NULL) AS deleted FROM "ProjectAsset" pa JOIN "Project" p ON p.id=pa."projectId" LEFT JOIN "ProjectTranslation" t ON t."projectId"=p.id AND t.locale='ko' WHERE pa."assetId"=a.id
      UNION ALL SELECT 'post',${publicOnly ? 'NULL::text' : 'p.id::text'},${publicOnly ? "'게시글'" : 'COALESCE(t.title,p.slug)'},'INLINE',(p."deletedAt" IS NOT NULL) FROM "PostAsset" pa JOIN "Post" p ON p.id=pa."postId" LEFT JOIN "PostTranslation" t ON t."postId"=p.id AND t.locale='ko' WHERE pa."assetId"=a.id
    ) u),'[]'::jsonb) AS usages FROM "Asset" a
    WHERE ${publicOnly ? "$1::text = ''" : 'position(lower($1) in lower(a."originalName")) > 0'}
    AND ($2 = 'all' OR (EXISTS(SELECT 1 FROM "ProjectAsset" WHERE "assetId"=a.id) OR EXISTS(SELECT 1 FROM "PostAsset" WHERE "assetId"=a.id)) = ($2 = 'used'))
    ORDER BY CASE WHEN $3='size' THEN a."byteSize" END DESC, CASE WHEN $3='old' THEN a."createdAt" END ASC, a."createdAt" DESC,a.id`,
      [
        publicOnly ? '' : search.keyword.trim(),
        ['used', 'unused'].includes(search.filter) ? search.filter : 'all',
        ['old', 'size'].includes(search.sort) ? search.sort : 'new',
      ],
    ),
    pool.query(
      `SELECT count(*)::int AS total,COALESCE(sum(a."byteSize"),0)::float8 AS size,count(*) FILTER (WHERE NOT EXISTS(SELECT 1 FROM "ProjectAsset" WHERE "assetId"=a.id) AND NOT EXISTS(SELECT 1 FROM "PostAsset" WHERE "assetId"=a.id))::int AS unused,COALESCE(sum(a."byteSize") FILTER (WHERE NOT EXISTS(SELECT 1 FROM "ProjectAsset" WHERE "assetId"=a.id) AND NOT EXISTS(SELECT 1 FROM "PostAsset" WHERE "assetId"=a.id)),0)::float8 AS "unusedSize" FROM "Asset" a`,
    ),
  ]);
  return {
    assets: result.rows,
    totals: totals.rows[0] as {
      total: number;
      size: number;
      unused: number;
      unusedSize: number;
    },
  };
}
async function removeOne(id: string): Promise<string | null> {
  const client = await pool.connect();
  let original = '',
    staged = '',
    moved = false,
    committed = false;
  try {
    await requireAdmin();
    await client.query('BEGIN');
    const row = (
      await client.query(
        'SELECT "storageKey" FROM "Asset" WHERE id=$1 FOR UPDATE',
        [id],
      )
    ).rows[0];
    if (!row) throw Error('파일이 이미 삭제되었습니다.');
    const refs = await client.query(
      'SELECT EXISTS(SELECT 1 FROM "ProjectAsset" WHERE "assetId"=$1) OR EXISTS(SELECT 1 FROM "PostAsset" WHERE "assetId"=$1) AS used',
      [id],
    );
    if (refs.rows[0].used) throw Error('사용 중인 파일은 삭제할 수 없습니다.');
    if (
      !/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(png|jpg|webp|pdf)$/.test(
        row.storageKey,
      ) ||
      !process.env.STORAGE_ROOT
    )
      throw Error('저장 경로를 확인할 수 없습니다.');
    const root = await realpath(process.env.STORAGE_ROOT);
    original = await realpath(path.join(root, row.storageKey));
    const relative = path.relative(root, original);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
      throw Error('잘못된 저장 경로입니다.');
    staged = original + '.delete-' + randomUUID();
    await rename(original, staged);
    moved = true;
    await client.query('DELETE FROM "Asset" WHERE id=$1', [id]);
    await client.query('COMMIT');
    committed = true;
    logEvent('info', 'admin.changed', {
      operation: 'asset.delete',
      targetId: id,
      success: true,
    });
    try {
      await unlink(staged);
    } catch (error) {
      logError('asset.cleanup', error);
      return 'DB 기록은 삭제됐지만 NAS 임시 파일을 정리하지 못했습니다. 서버 로그를 확인해 주세요.';
    }
    return null;
  } catch (error) {
    logError('admin-assets', error);
    if (!committed) {
      await client.query('ROLLBACK').catch(() => {});
      if (moved) {
        try {
          await rename(staged, original);
        } catch (error) {
          logError('asset.restore', error);
          return '삭제 실패 후 NAS 파일을 복구하지 못했습니다. 서버 로그를 확인해 주세요.';
        }
      }
    }
    const messages = [
      '개발 DB만 변경할 수 있습니다.',
      '파일이 이미 삭제되었습니다.',
      '사용 중인 파일은 삭제할 수 없습니다.',
      '저장 경로를 확인할 수 없습니다.',
      '잘못된 저장 경로입니다.',
    ];
    return error instanceof Error && messages.includes(error.message)
      ? error.message
      : '파일 삭제에 실패했습니다. 저장소와 DB 연결을 확인해 주세요.';
  } finally {
    client.release();
  }
}
export async function deleteAssetsRequest(request: Request) {
  const json = (body: object, status: number) =>
    Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!(await getAdminSession(request.headers)) || !hasSameOrigin(request))
    return json({ message: '관리자 로그인 후에만 삭제할 수 있습니다.' }, 403);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ message: '삭제할 파일을 선택해 주세요.' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 8192) {
        await reader.cancel();
        return json({ message: '요청이 너무 큽니다.' }, 413);
      }
      chunks.push(part.value);
    }
    let ids: unknown;
    try {
      ids = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return json({ message: '입력 형식이 올바르지 않습니다.' }, 400);
    }
    if (!assetIdsValid(ids))
      return json({ message: '삭제할 파일을 확인해 주세요.' }, 400);
    await requireAdmin();
    const failures: { id: string; message: string }[] = [];
    for (const id of ids) {
      const error = await removeOne(id).catch(() => 'DB 연결에 실패했습니다.');
      if (error) failures.push({ id, message: error });
    }
    return json({ deleted: ids.length - failures.length, failures }, 200);
  } catch {
    return json(
      {
        message: '파일 삭제에 실패했습니다. 저장소와 DB 연결을 확인해 주세요.',
      },
      503,
    );
  }
}
