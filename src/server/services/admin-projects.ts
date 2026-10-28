import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import { pool } from '@/server/db';
import {
  blankCopy,
  inlineAssetIds,
  parseProjectForm,
  uuid,
  type ProjectForm,
  type ProjectListItem,
  type ProjectCode,
} from '@/lib/project-form';
class ProjectError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function getAdminProjects(
  search = { keyword: '', originCode: '', typeCode: '', isVisible: '' },
) {
  if (process.env.NODE_ENV !== 'development')
    throw Error('Development admin only');
  const identity = await pool.query('SELECT current_database() AS name');
  if (identity.rows[0].name !== 'oz_dev')
    throw Error('Development database required');
  const [projects, codes] = await Promise.all([
    pool.query<ProjectListItem>(
      `SELECT p.id,p.version,p.slug,p."customerName",COALESCE(to_char(p."startedOn",'YYYY-MM-DD'),'') AS "startedOn",COALESCE(to_char(p."endedOn",'YYYY-MM-DD'),'') AS "endedOn",to_char(p."updatedAt" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",p."originCode",COALESCE(p."typeCode",'') AS "typeCode",COALESCE(p.lifecycle::text,'') AS lifecycle,p."isVisible",p.placeholder,
 COALESCE((SELECT array_agg(t.name ORDER BY pt.position,t.id) FROM "ProjectTag" pt JOIN "Tag" t ON t.id=pt."tagId" WHERE pt."projectId"=p.id AND t.kind='TECHNOLOGY'),'{}') AS technologies,
 COALESCE((SELECT array_agg(t.name ORDER BY pt.position,t.id) FROM "ProjectTag" pt JOIN "Tag" t ON t.id=pt."tagId" WHERE pt."projectId"=p.id AND t.kind='TOPIC'),'{}') AS tags,
 (SELECT jsonb_object_agg(locale,jsonb_build_object('title',title,'summary',summary)) FROM "ProjectTranslation" WHERE "projectId"=p.id) AS translations
 FROM "Project" p WHERE p."deletedAt" IS NULL
 AND ($1 = '' OR position(lower($1) in lower(concat_ws(' ', p.slug, p."customerName", (SELECT string_agg(concat_ws(' ', title, summary), ' ') FROM "ProjectTranslation" WHERE "projectId"=p.id), (SELECT string_agg(t.name, ' ') FROM "ProjectTag" pt JOIN "Tag" t ON t.id=pt."tagId" WHERE pt."projectId"=p.id)))) > 0)
 AND ($2 = '' OR p."originCode"=$2)
 AND ($3 = '' OR ($3 = '__unset__' AND p."typeCode" IS NULL) OR p."typeCode"=$3)
 AND ($4 = '' OR p."isVisible"::text=$4)
 ORDER BY p."startedOn" DESC NULLS LAST,p.id`,
      [
        search.keyword.trim(),
        search.originCode,
        search.typeCode,
        search.isVisible,
      ],
    ),
    pool.query<ProjectCode>(
      'SELECT "groupKey",code,"nameKo","isActive" FROM "CommonCode" ORDER BY "groupKey",position,code',
    ),
  ]);
  return {
    projects: projects.rows.map((p) => ({
      ...p,
      translations: {
        ko: p.translations?.ko ?? { title: '', summary: '' },
        en: p.translations?.en ?? { title: '', summary: '' },
      },
    })),
    codes: codes.rows,
  };
}

export async function getAdminProject(id: string): Promise<ProjectForm | null> {
  if (process.env.NODE_ENV !== 'development')
    throw Error('Development admin only');
  const identity = await pool.query('SELECT current_database() AS name');
  if (identity.rows[0].name !== 'oz_dev')
    throw Error('Development database required');
  const result = await pool.query<ProjectForm>(
    `SELECT p.id,p.version,p.slug,p."customerName",COALESCE(to_char(p."startedOn",'YYYY-MM-DD'),'') AS "startedOn",COALESCE(to_char(p."endedOn",'YYYY-MM-DD'),'') AS "endedOn",to_char(p."updatedAt" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",p."originCode",COALESCE(p."typeCode",'') AS "typeCode",COALESCE(p.lifecycle::text,'') AS lifecycle,p."isVisible",p.placeholder,
    COALESCE(p."thumbnailUrl",(SELECT '/api/assets/'||"assetId" FROM "ProjectAsset" WHERE "projectId"=p.id AND usage='COVER'),'') AS thumbnail,
    (SELECT jsonb_build_object('id',a.id,'name',a."originalName",'size',a."byteSize",'mimeType',a."mimeType",'url','/api/assets/'||a.id,'downloadUrl','/api/assets/'||a.id||'?download=1') FROM "ProjectAsset" pa JOIN "Asset" a ON a.id=pa."assetId" WHERE pa."projectId"=p.id AND pa.usage='COVER' LIMIT 1) AS "thumbnailFile",
    COALESCE((SELECT array_agg(t.name ORDER BY pt.position,t.id) FROM "ProjectTag" pt JOIN "Tag" t ON t.id=pt."tagId" WHERE pt."projectId"=p.id AND t.kind='TECHNOLOGY'),'{}') AS technologies,
    COALESCE((SELECT array_agg(t.name ORDER BY pt.position,t.id) FROM "ProjectTag" pt JOIN "Tag" t ON t.id=pt."tagId" WHERE pt."projectId"=p.id AND t.kind='TOPIC'),'{}') AS tags,
    COALESCE((SELECT array_agg("assetId"::text ORDER BY position,id) FROM "ProjectAsset" WHERE "projectId"=p.id AND usage='ATTACHMENT'),'{}') AS "attachmentIds",
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',a.id,'name',a."originalName",'size',a."byteSize",'mimeType',a."mimeType",'url','/api/assets/'||a.id,'downloadUrl','/api/assets/'||a.id||'?download=1')) FROM "ProjectAsset" pa JOIN "Asset" a ON a.id=pa."assetId" WHERE pa."projectId"=p.id AND pa.usage='ATTACHMENT'),'[]'::jsonb) AS files,
    (SELECT jsonb_object_agg(locale,jsonb_build_object('title',title,'summary',summary,'body',body)) FROM "ProjectTranslation" WHERE "projectId"=p.id) AS translations
    FROM "Project" p WHERE p.id=$1 AND p."deletedAt" IS NULL`,
    [id],
  );
  const project = result.rows[0];
  return project
    ? {
        ...project,
        translations: {
          ko: project.translations?.ko ?? blankCopy(),
          en: project.translations?.en ?? blankCopy(),
        },
      }
    : null;
}

export async function getAdminProjectCount(): Promise<number> {
  if (process.env.NODE_ENV !== 'development')
    throw Error('Development admin only');
  if (
    (await pool.query('SELECT current_database() AS name')).rows[0].name !==
    'oz_dev'
  )
    throw Error('Development database required');
  return Number(
    (
      await pool.query<{ count: string }>(
        'SELECT count(*)::text AS count FROM "Project" WHERE "deletedAt" IS NULL',
      )
    ).rows[0].count,
  );
}
export async function saveProject(input: unknown) {
  if (process.env.NODE_ENV !== 'development')
    throw new ProjectError(403, '로컬 개발 관리자 전용입니다.');
  let form: ProjectForm;
  try {
    form = parseProjectForm(input);
  } catch (error) {
    throw new ProjectError(
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
      throw new ProjectError(403, '개발 DB만 변경할 수 있습니다.');
    await client.query('BEGIN');
    const current = form.id
      ? (
          await client.query('SELECT * FROM "Project" WHERE id=$1 FOR UPDATE', [
            form.id,
          ])
        ).rows[0]
      : null;
    if (
      form.id &&
      (!current || current.deletedAt || current.version !== form.version)
    )
      throw new ProjectError(
        409,
        '다른 변경이 있습니다. 새로고침 후 다시 수정해 주세요.',
      );
    for (const [group, code, old] of [
      ['PROJECT_ORIGIN', form.originCode, current?.originCode],
      ['PROJECT_TYPE', form.typeCode, current?.typeCode],
    ]) {
      if (!code && group === 'PROJECT_TYPE') continue;
      const row = (
        await client.query(
          'SELECT "isActive" FROM "CommonCode" WHERE "groupKey"=$1 AND code=$2',
          [group, code],
        )
      ).rows[0];
      if (!row || (!row.isActive && old !== code))
        throw new ProjectError(400, '사용할 수 없는 프로젝트 분류입니다.');
    }
    const technologyCodes = await client.query(
      'SELECT "nameKo" FROM "CommonCode" WHERE "groupKey"=$1 AND "isActive"=true AND "nameKo"=ANY($2::text[])',
      ['TECHNOLOGY', form.technologies],
    );
    const previousTechnologies = form.id
      ? (
          await client.query<{ name: string }>(
            'SELECT t.name FROM "ProjectTag" pt JOIN "Tag" t ON t.id=pt."tagId" WHERE pt."projectId"=$1 AND t.kind=\'TECHNOLOGY\'',
            [form.id],
          )
        ).rows
      : [];
    const allowedTechnologies = new Set([
      ...technologyCodes.rows.map((row) => row.nameKo),
      ...previousTechnologies.map((row) => row.name),
    ]);
    if (form.technologies.some((name) => !allowedTechnologies.has(name)))
      throw new ProjectError(
        400,
        '사용 기술은 공통 코드 목록에서 선택해 주세요.',
      );
    const id = form.id || randomUUID();
    if (form.id)
      await client.query(
        'UPDATE "Project" SET slug=$2,"originCode"=$3,"typeCode"=$4,lifecycle=$5,"isVisible"=$6,placeholder=$7,"thumbnailUrl"=$8,"startedOn"=NULLIF($9,\'\')::date,"endedOn"=NULLIF($10,\'\')::date,version=version+1,"updatedAt"=now() WHERE id=$1',
        [
          id,
          form.slug,
          form.originCode,
          form.typeCode || null,
          form.lifecycle || null,
          form.isVisible,
          form.placeholder,
          form.thumbnail || null,
          form.startedOn,
          form.endedOn,
        ],
      );
    else
      await client.query(
        'INSERT INTO "Project" (id,slug,"originCode","typeCode",lifecycle,"isVisible",placeholder,"thumbnailUrl","startedOn","endedOn","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULLIF($9,\'\')::date,NULLIF($10,\'\')::date,now())',
        [
          id,
          form.slug,
          form.originCode,
          form.typeCode || null,
          form.lifecycle || null,
          form.isVisible,
          form.placeholder,
          form.thumbnail || null,
          form.startedOn,
          form.endedOn,
        ],
      );
    await client.query('UPDATE "Project" SET "customerName"=$2 WHERE id=$1', [
      id,
      form.customerName,
    ]);
    for (const locale of ['ko', 'en'] as const) {
      const copy = form.translations[locale];
      if (locale === 'en' && !copy.title) {
        await client.query(
          'DELETE FROM "ProjectTranslation" WHERE "projectId"=$1 AND locale=$2',
          [id, locale],
        );
        continue;
      }
      await client.query(
        'INSERT INTO "ProjectTranslation" ("projectId",locale,title,summary,body) VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("projectId",locale) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,body=EXCLUDED.body',
        [id, locale, copy.title, copy.summary, JSON.stringify(copy.body)],
      );
    }
    await client.query('DELETE FROM "ProjectTag" WHERE "projectId"=$1', [id]);
    for (const [kind, names] of [
      ['TECHNOLOGY', form.technologies],
      ['TOPIC', form.tags],
    ] as const) {
      for (const [position, name] of names.entries()) {
        const slug = createHash('sha256')
          .update(name.normalize('NFKC').toLowerCase())
          .digest('hex');
        await client.query(
          'INSERT INTO "Tag" (id,kind,slug,name) VALUES ($1,$2,$3,$4) ON CONFLICT (kind,slug) DO NOTHING',
          [randomUUID(), kind, slug, name],
        );
        const tag = (
          await client.query('SELECT id FROM "Tag" WHERE kind=$1 AND slug=$2', [
            kind,
            slug,
          ])
        ).rows[0];
        await client.query(
          'INSERT INTO "ProjectTag" ("projectId","tagId",position) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
          [id, tag.id, position],
        );
      }
    }
    const cover = form.thumbnail.match(
      /^\/api\/assets\/([0-9a-f-]{36})$/i,
    )?.[1];
    const inline = [
      ...new Set([
        ...inlineAssetIds(form.translations.ko.body),
        ...(form.translations.en.title
          ? inlineAssetIds(form.translations.en.body)
          : []),
      ]),
    ];
    const links = [
      ...(cover ? [{ id: cover, usage: 'COVER' }] : []),
      ...inline.map((id) => ({ id, usage: 'INLINE' })),
      ...form.attachmentIds.map((id) => ({ id, usage: 'ATTACHMENT' })),
    ];
    for (const link of links) {
      const asset = (
        await client.query('SELECT "mimeType" FROM "Asset" WHERE id=$1', [
          link.id,
        ])
      ).rows[0];
      if (
        !asset ||
        (link.usage !== 'ATTACHMENT' &&
          !['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType))
      )
        throw new ProjectError(
          400,
          '삭제되었거나 사용할 수 없는 첨부파일입니다.',
        );
    }
    await client.query(
      `DELETE FROM "ProjectAsset" pa WHERE pa."projectId"=$1 AND NOT EXISTS (SELECT 1 FROM jsonb_to_recordset($2::jsonb) AS desired(id uuid,usage text) WHERE desired.id=pa."assetId" AND desired.usage=pa.usage::text)`,
      [id, JSON.stringify(links)],
    );
    for (const [position, link] of links.entries())
      await client.query(
        'INSERT INTO "ProjectAsset" (id,"projectId","assetId",usage,position) VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("projectId","assetId",usage) DO UPDATE SET position=EXCLUDED.position',
        [randomUUID(), id, link.id, link.usage, position],
      );
    await client.query('COMMIT');
    return { id, version: form.id ? form.version + 1 : 1 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function deleteProjects(input: unknown) {
  if (process.env.NODE_ENV !== 'development')
    throw new ProjectError(403, '로컬 개발 관리자 전용입니다.');
  if (!Array.isArray(input) || input.length === 0 || input.length > 100)
    throw new ProjectError(400, '삭제할 프로젝트를 선택해 주세요.');
  const items: { id: string; version: number }[] = [];
  for (const item of input) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      !uuid(item.id) ||
      !Number.isSafeInteger(item.version) ||
      item.version < 1 ||
      items.some((value) => value.id === item.id)
    )
      throw new ProjectError(400, '삭제할 프로젝트 정보를 확인해 주세요.');
    items.push({ id: item.id, version: item.version });
  }
  const client = await pool.connect();
  try {
    if (
      (await client.query('SELECT current_database() AS name')).rows[0].name !==
      'oz_dev'
    )
      throw new ProjectError(403, '개발 DB만 변경할 수 있습니다.');
    await client.query('BEGIN');
    const rows = (
      await client.query<{ id: string; version: number }>(
        'SELECT id,version FROM "Project" WHERE id=ANY($1::uuid[]) AND "deletedAt" IS NULL ORDER BY id FOR UPDATE',
        [items.map((item) => item.id)],
      )
    ).rows;
    if (
      rows.length !== items.length ||
      rows.some(
        (row) =>
          items.find((item) => item.id === row.id)?.version !== row.version,
      )
    )
      throw new ProjectError(
        409,
        '다른 변경이 있습니다. 새로고침 후 다시 선택해 주세요.',
      );
    await client.query(
      'UPDATE "Project" SET "deletedAt"=now(),"updatedAt"=now(),version=version+1 WHERE id=ANY($1::uuid[])',
      [items.map((item) => item.id)],
    );
    await client.query('COMMIT');
    return { deleted: items.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function saveProjectRequest(request: Request) {
  try {
    // shortcut: localhost development only; replace this gate with admin session authorization before production use.
    if (
      process.env.NODE_ENV !== 'development' ||
      !['localhost', '127.0.0.1', '[::1]'].includes(
        new URL(request.url).hostname,
      ) ||
      request.headers.get('origin') !== new URL(request.url).origin
    )
      throw new ProjectError(
        403,
        '프로젝트 변경은 로컬 개발 관리자에서만 지원합니다.',
      );
    const reader = request.body?.getReader();
    if (!reader) throw new ProjectError(400, '입력을 확인해 주세요.');
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 512000) {
        await reader.cancel();
        throw new ProjectError(413, '본문 크기가 너무 큽니다.');
      }
      chunks.push(part.value);
    }
    let input: unknown;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new ProjectError(400, '입력 형식이 올바르지 않습니다.');
    }
    return Response.json(
      await (request.method === 'DELETE'
        ? deleteProjects(input)
        : saveProject(input)),
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    const status =
      error instanceof ProjectError
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
          error instanceof ProjectError
            ? error.message
            : status === 409
              ? '이미 사용 중인 주소입니다.'
              : '저장에 실패했습니다. 입력은 유지됩니다.',
      },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
