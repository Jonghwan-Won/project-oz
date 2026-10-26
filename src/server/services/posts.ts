import 'server-only';
import { pool } from '@/server/db';
import { blankCopy } from '@/lib/project-form';
import type { PostForm } from '@/lib/post-form';
import type { ProjectCopy } from '@/lib/project-form';

export async function getAdminPosts(): Promise<PostForm[]> {
  if (process.env.NODE_ENV !== 'development')
    throw Error('Development admin only');
  if (
    (await pool.query('SELECT current_database() AS name')).rows[0].name !==
    'oz_dev'
  )
    throw Error('Development database required');
  const result =
    await pool.query<PostForm>(`SELECT p.id,p.version,p.slug,p.category,p."isVisible",
    p."createdAt"::text AS "createdAt",p."updatedAt"::text AS "updatedAt",
    (SELECT jsonb_object_agg(locale,jsonb_build_object('title',title,'summary',summary,'body',body))
      FROM "PostTranslation" WHERE "postId"=p.id) AS translations
    FROM "Post" p WHERE p."deletedAt" IS NULL ORDER BY p."createdAt" DESC,p.id`);
  return result.rows.map((p) => ({
    ...p,
    translations: {
      ko: p.translations?.ko ?? blankCopy(),
      en: p.translations?.en ?? blankCopy(),
    },
  }));
}

export type PublicPost = ProjectCopy & {
  id: string;
  slug: string;
  category: string;
  date: string;
  excerpt: string;
  contentLocale: string;
};
export async function getPublicPosts(
  locale: string,
  slug?: string,
): Promise<PublicPost[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const result = await pool.query<PublicPost>(
      `SELECT p.id::text AS id,p.slug,p.category,
    to_char(p."createdAt" AT TIME ZONE 'Asia/Seoul','YYYY.MM.DD') AS date,
    COALESCE(t.title,k.title) AS title,COALESCE(t.summary,k.summary) AS summary,
    COALESCE(t.summary,k.summary) AS excerpt,COALESCE(t.body,k.body) AS body,
    COALESCE(t.locale,k.locale) AS "contentLocale"
    FROM "Post" p JOIN "PostTranslation" k ON k."postId"=p.id AND k.locale='ko'
    LEFT JOIN "PostTranslation" t ON t."postId"=p.id AND t.locale=$1
    WHERE p."isVisible"=true AND p."deletedAt" IS NULL AND ($2::text IS NULL OR p.slug=$2 OR p.id::text=$2)
    ORDER BY p."createdAt" DESC,p.id`,
      [locale, slug ?? null],
    );
    return result.rows;
  } catch {
    throw Error('Could not load public posts');
  }
}
