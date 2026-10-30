import 'server-only';
import { pool } from '@/server/db';
import {
  defaultPostCategories,
  type PostCategory,
} from '@/lib/post-categories';
export async function getPostCategories(): Promise<PostCategory[]> {
  if (!process.env.DATABASE_URL) return defaultPostCategories;
  return (
    await pool.query<PostCategory>(
      'SELECT code,"nameKo","nameEn","isActive" FROM "CommonCode" WHERE "groupKey"= $1 ORDER BY position,code',
      ['POST_CATEGORY'],
    )
  ).rows;
}
