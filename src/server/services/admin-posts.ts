import 'server-only';
import { randomUUID } from 'node:crypto';
import { pool } from '@/server/db';
import { parsePostForm } from '@/lib/post-form';
import { inlineAssetIds, uuid } from '@/lib/project-form';

class PostError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function savePost(input: unknown) {
  if (process.env.NODE_ENV !== 'development')
    throw new PostError(403, '로컬 개발 관리자 전용입니다.');
  let form;
  try {
    form = parsePostForm(input);
  } catch (error) {
    throw new PostError(
      400,
      error instanceof Error ? error.message : '입력을 확인해 주세요.',
    );
  }
  const client = await pool.connect();
  try {
    if (
      (await client.query('SELECT current_database() AS name')).rows[0].name !==
      'oz_dev'
    )
      throw new PostError(403, '개발 DB만 변경할 수 있습니다.');
    await client.query('BEGIN');
    if (form.id) {
      const current = (
        await client.query(
          'SELECT version,"deletedAt" FROM "Post" WHERE id=$1 FOR UPDATE',
          [form.id],
        )
      ).rows[0];
      if (!current || current.deletedAt || current.version !== form.version)
        throw new PostError(
          409,
          '다른 변경이 있습니다. 새로고침 후 다시 수정해 주세요.',
        );
    }
    const id = form.id || randomUUID();
    const copies = Object.entries(form.translations).filter(
      ([locale, copy]) => locale === 'ko' || copy.title,
    );
    const assets = [
      ...new Set(copies.flatMap(([, copy]) => inlineAssetIds(copy.body))),
    ];
    if (assets.length) {
      const found = await client.query(
        "SELECT id FROM \"Asset\" WHERE id=ANY($1::uuid[]) AND \"mimeType\" IN ('image/png','image/jpeg','image/webp')",
        [assets],
      );
      if (found.rows.length !== assets.length)
        throw new PostError(400, '본문 이미지를 확인해 주세요.');
    }
    if (form.id)
      await client.query(
        'UPDATE "Post" SET category=$2,"isVisible"=$3,"updatedAt"=now(),version=version+1 WHERE id=$1',
        [id, form.category, form.isVisible],
      );
    else
      await client.query(
        'INSERT INTO "Post" (id,slug,category,"isVisible") VALUES ($1,$2,$3,$4)',
        [id, id, form.category, form.isVisible],
      );
    await client.query('DELETE FROM "PostTranslation" WHERE "postId"=$1', [id]);
    for (const [locale, copy] of copies)
      await client.query(
        'INSERT INTO "PostTranslation" ("postId",locale,title,summary,body) VALUES ($1,$2,$3,$4,$5::jsonb)',
        [id, locale, copy.title, copy.summary, JSON.stringify(copy.body)],
      );
    await client.query('DELETE FROM "PostAsset" WHERE "postId"=$1', [id]);
    for (const asset of assets)
      await client.query(
        'INSERT INTO "PostAsset" ("postId","assetId") VALUES ($1,$2)',
        [id, asset],
      );
    await client.query('COMMIT');
    return { id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePosts(input: unknown) {
  if (process.env.NODE_ENV !== 'development')
    throw new PostError(403, '로컬 개발 관리자 전용입니다.');
  if (
    !Array.isArray(input) ||
    !input.length ||
    input.length > 100 ||
    !input.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        uuid(item.id) &&
        Number.isSafeInteger(item.version) &&
        item.version > 0,
    ) ||
    new Set(input.map((item) => item.id)).size !== input.length
  )
    throw new PostError(400, '삭제할 게시글을 확인해 주세요.');
  const client = await pool.connect();
  try {
    if (
      (await client.query('SELECT current_database() AS name')).rows[0].name !==
      'oz_dev'
    )
      throw new PostError(403, '개발 DB만 변경할 수 있습니다.');
    await client.query('BEGIN');
    const rows = (
      await client.query(
        'SELECT id,version FROM "Post" WHERE id=ANY($1::uuid[]) AND "deletedAt" IS NULL ORDER BY id FOR UPDATE',
        [input.map((item) => item.id)],
      )
    ).rows;
    if (
      rows.length !== input.length ||
      rows.some(
        (row) =>
          !input.some(
            (item) => item.id === row.id && item.version === row.version,
          ),
      )
    )
      throw new PostError(
        409,
        '다른 변경이 있습니다. 새로고침 후 다시 선택해 주세요.',
      );
    await client.query(
      'UPDATE "Post" SET "deletedAt"=now(),"updatedAt"=now(),version=version+1 WHERE id=ANY($1::uuid[])',
      [input.map((item) => item.id)],
    );
    await client.query('COMMIT');
    return { deleted: input.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function savePostRequest(request: Request) {
  try {
    // shortcut: localhost development only; replace this gate with admin session authorization before production use.
    if (
      process.env.NODE_ENV !== 'development' ||
      !['localhost', '127.0.0.1', '[::1]'].includes(
        new URL(request.url).hostname,
      ) ||
      request.headers.get('origin') !== new URL(request.url).origin
    )
      throw new PostError(
        403,
        '게시글 변경은 로컬 개발 관리자에서만 지원합니다.',
      );
    const reader = request.body?.getReader();
    if (!reader) throw new PostError(400, '입력을 확인해 주세요.');
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 512000) {
        await reader.cancel();
        throw new PostError(413, '본문 크기가 너무 큽니다.');
      }
      chunks.push(part.value);
    }
    let input: unknown;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new PostError(400, '입력 형식이 올바르지 않습니다.');
    }
    return Response.json(
      await (request.method === 'DELETE'
        ? deletePosts(input)
        : savePost(input)),
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    const status =
      error instanceof PostError
        ? error.status
        : error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === '23505'
          ? 409
          : 503;
    return Response.json(
      {
        message:
          error instanceof PostError
            ? error.message
            : status === 409
              ? '이미 사용 중인 주소입니다.'
              : '저장에 실패했습니다. 입력은 유지됩니다.',
      },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
