import { requireAdmin } from '@/server/admin-access';
import 'server-only';
import { cache } from 'react';
import { pool } from '@/server/db';
import { blankCopy, uuid } from '@/lib/project-form';
import type { PostForm, PostListItem } from '@/lib/post-form';
import type { ProjectCopy } from '@/lib/project-form';

export async function getAdminPosts(
  search = { keyword: '', category: '', status: '' },
  publicOnly = false,
): Promise<PostListItem[]> {
  if (!publicOnly) await requireAdmin();
  if (publicOnly && !process.env.DATABASE_URL) return [];
  const result = await pool.query<PostListItem>(
    `SELECT p.id,p.version,p.slug,p.category,p."isVisible",
    p."createdAt"::text AS "createdAt",p."updatedAt"::text AS "updatedAt",
    (SELECT jsonb_object_agg(locale,jsonb_build_object('title',title,'summary',summary))
      FROM "PostTranslation" WHERE "postId"=p.id) AS translations
    FROM "Post" p WHERE p."deletedAt" IS NULL ${publicOnly ? 'AND p."isVisible"=true' : ''}
    AND ($1 = '' OR position(lower($1) in lower(concat_ws(' ', p.slug, (SELECT string_agg(concat_ws(' ', title, summary), ' ') FROM "PostTranslation" WHERE "postId"=p.id)))) > 0)
    AND ($2 = '' OR p.category=$2)
    AND ($3 = '' OR p."isVisible"=($3 = '공개'))
    ORDER BY p."createdAt" DESC,p.id`,
    [search.keyword.trim(), search.category, search.status],
  );
  return result.rows.map((p) => ({
    ...p,
    translations: {
      ko: p.translations?.ko ?? { title: '', summary: '' },
      en: p.translations?.en ?? { title: '', summary: '' },
    },
  }));
}

export async function getAdminPost(
  id: string,
  publicOnly = false,
): Promise<PostForm | null> {
  if (!publicOnly) await requireAdmin();
  if (publicOnly && !process.env.DATABASE_URL) return null;
  if (!uuid(id)) return null;
  const result = await pool.query<PostForm>(
    `SELECT p.id,p.version,p.slug,p.category,p."isVisible",
    p."createdAt"::text AS "createdAt",p."updatedAt"::text AS "updatedAt",
    (SELECT jsonb_object_agg(locale,jsonb_build_object('title',title,'summary',summary,'body',body)) FROM "PostTranslation" WHERE "postId"=p.id) AS translations
    FROM "Post" p WHERE p.id=$1 AND p."deletedAt" IS NULL ${publicOnly ? 'AND p."isVisible"=true' : ''}`,
    [id],
  );
  const post = result.rows[0];
  return post
    ? {
        ...post,
        translations: {
          ko: post.translations?.ko ?? blankCopy(),
          en: post.translations?.en ?? blankCopy(),
        },
      }
    : null;
}

export async function getAdminPostCount(publicOnly = false): Promise<number> {
  if (!publicOnly) await requireAdmin();
  if (publicOnly && !process.env.DATABASE_URL) return 0;
  return Number(
    (
      await pool.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM "Post" WHERE "deletedAt" IS NULL ${publicOnly ? 'AND "isVisible"=true' : ''}`,
      )
    ).rows[0].count,
  );
}
export async function getAdminPostSummary(publicOnly = false) {
  if (!publicOnly) await requireAdmin();
  if (publicOnly && !process.env.DATABASE_URL) return { total: 0, visible: 0 };
  const result = await pool.query<{ total: number; visible: number }>(
    `SELECT count(*)::int AS total, count(*) FILTER (WHERE "isVisible")::int AS visible FROM "Post" WHERE "deletedAt" IS NULL ${publicOnly ? 'AND "isVisible"=true' : ''}`,
  );
  return result.rows[0];
}

export type PublicPost = ProjectCopy & {
  id: string;
  slug: string;
  category: string;
  date: string;
  excerpt: string;
  contentLocale: string;
};
export type PublicPostListItem = Omit<PublicPost, 'body'>;
export async function getPublicPosts(
  locale: string,
): Promise<PublicPostListItem[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const result = await pool.query<PublicPostListItem>(
      `SELECT p.id::text AS id,p.slug,p.category,
    to_char(p."createdAt" AT TIME ZONE 'Asia/Seoul','YYYY.MM.DD') AS date,
    COALESCE(t.title,k.title) AS title,COALESCE(t.summary,k.summary) AS summary,
    COALESCE(t.summary,k.summary) AS excerpt,
    COALESCE(t.locale,k.locale) AS "contentLocale"
    FROM "Post" p JOIN "PostTranslation" k ON k."postId"=p.id AND k.locale='ko'
    LEFT JOIN "PostTranslation" t ON t."postId"=p.id AND t.locale=$1
    WHERE p."isVisible"=true AND p."deletedAt" IS NULL
    ORDER BY p."createdAt" DESC,p.id`,
      [locale],
    );
    return result.rows;
  } catch {
    throw Error('Could not load public posts');
  }
}

export const getPublicPost = cache(
  async (id: string, locale: string): Promise<PublicPost | null> => {
    if (!process.env.DATABASE_URL) return null;
    try {
      const byId =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );
      const result = await pool.query<PublicPost>(
        `SELECT p.id::text AS id,p.slug,p.category,
      to_char(p."createdAt" AT TIME ZONE 'Asia/Seoul','YYYY.MM.DD') AS date,
      COALESCE(t.title,k.title) AS title,COALESCE(t.summary,k.summary) AS summary,
      COALESCE(t.summary,k.summary) AS excerpt,COALESCE(t.body,k.body) AS body,
      COALESCE(t.locale,k.locale) AS "contentLocale"
      FROM "Post" p JOIN "PostTranslation" k ON k."postId"=p.id AND k.locale='ko'
      LEFT JOIN "PostTranslation" t ON t."postId"=p.id AND t.locale=$2
      WHERE p."isVisible"=true AND p."deletedAt" IS NULL AND ${byId ? 'p.id=$1::uuid' : 'p.slug=$1'} LIMIT 1`,
        [id, locale],
      );
      return result.rows[0] ?? null;
    } catch {
      throw Error('Could not load public post');
    }
  },
);
