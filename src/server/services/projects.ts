import type { UploadedAsset } from '@/lib/files';
import 'server-only';
import { cache } from 'react';
import { pool } from '@/server/db';
import type { Messages } from '@/i18n/ko';
import type { Locale } from '@/i18n/locale';

export type PublicProject = {
  customerName: string;
  startedOn: string | null;
  endedOn: string | null;
  slug: string;
  placeholder: boolean;
  lifecycle: keyof Messages['projectStatuses'] | null;
  originLabel: string;
  type: string | null;
  typeLabel: string | null;
  title: string;
  summary: string;
  body: unknown;
  thumbnail: string | null;
  attachments: UploadedAsset[];
  contentLocale: Locale;
  tags: { name: string; kind: string }[];
};

export const getPublicProjects = cache(
  async (locale: Locale): Promise<PublicProject[]> => {
    if (!process.env.DATABASE_URL) return [];
    try {
      const result = await pool.query<PublicProject>(
        `SELECT p.slug,p."customerName",to_char(p."startedOn",'YYYY-MM-DD') AS "startedOn",to_char(p."endedOn",'YYYY-MM-DD') AS "endedOn", p.placeholder, p.lifecycle,
        p."typeCode" AS type,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('name',t.name,'kind',t.kind) ORDER BY pt.position,t.id) FROM "ProjectTag" pt JOIN "Tag" t ON t.id=pt."tagId" WHERE pt."projectId"=p.id),'[]'::jsonb) AS tags,
        CASE WHEN $1='en' THEN o."nameEn" ELSE o."nameKo" END AS "originLabel",
        CASE WHEN $1='en' THEN c."nameEn" ELSE c."nameKo" END AS "typeLabel",
        t.title,t.summary,t.body,t.locale AS "contentLocale",
        COALESCE(p."thumbnailUrl",CASE WHEN cover."assetId" IS NOT NULL THEN '/api/assets/'||cover."assetId" ELSE NULL END) AS thumbnail,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('id',a.id,'name',a."originalName",'size',a."byteSize",'mimeType',a."mimeType",'url','/api/assets/'||a.id,'downloadUrl','/api/assets/'||a.id||'?download=1') ORDER BY pa.position,pa.id)
          FROM "ProjectAsset" pa JOIN "Asset" a ON a.id=pa."assetId" WHERE pa."projectId"=p.id AND pa.usage='ATTACHMENT'),'[]'::jsonb) AS attachments
      FROM "Project" p
      JOIN "CommonCode" o ON o."groupKey"=p."originGroup" AND o.code=p."originCode"
      LEFT JOIN "CommonCode" c ON c."groupKey"=p."typeGroup" AND c.code=p."typeCode"
      LEFT JOIN "ProjectAsset" cover ON cover."projectId"=p.id AND cover.usage='COVER'
      JOIN LATERAL (
        SELECT title,summary,body,locale FROM "ProjectTranslation"
        WHERE "projectId"=p.id AND locale IN ($1,'ko')
        ORDER BY CASE WHEN locale=$1 THEN 0 ELSE 1 END LIMIT 1
      ) t ON true
      WHERE p."isVisible"=true AND p."deletedAt" IS NULL
      ORDER BY p."startedOn" DESC NULLS LAST,p.id`,
        [locale],
      );
      return result.rows;
    } catch {
      // Keep driver errors and connection credentials out of Next.js logs and responses.
      throw new Error('Could not load public projects');
    }
  },
);
