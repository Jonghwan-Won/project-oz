import 'server-only';
import { pool } from '@/server/db';

// The public dashboard exposes aggregate counts only, never inquiry or private content records.
export async function getDashboardSummary() {
  if (!process.env.DATABASE_URL)
    return {
      projectsSummary: { total: 0, visible: 0 },
      postsSummary: { total: 0, visible: 0 },
      unusedAssets: { count: 0, size: 0 },
      pendingInquiries: 0,
    };
  const [projects, posts, assets, inquiries] = await Promise.all([
    pool.query<{ total: number; visible: number }>(
      'SELECT count(*)::int AS total, count(*) FILTER (WHERE "isVisible")::int AS visible FROM "Project" WHERE "deletedAt" IS NULL',
    ),
    pool.query<{ total: number; visible: number }>(
      'SELECT count(*)::int AS total, count(*) FILTER (WHERE "isVisible")::int AS visible FROM "Post" WHERE "deletedAt" IS NULL',
    ),
    pool.query<{ count: number; size: number }>(
      'SELECT count(*)::int AS count,COALESCE(sum(a."byteSize"),0)::float8 AS size FROM "Asset" a WHERE NOT EXISTS (SELECT 1 FROM "ProjectAsset" WHERE "assetId"=a.id) AND NOT EXISTS (SELECT 1 FROM "PostAsset" WHERE "assetId"=a.id)',
    ),
    pool.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM "Inquiry" WHERE "statusGroup"=$1 AND "statusCode"=$2',
      ['INQUIRY_STATUS', '0'],
    ),
  ]);
  return {
    projectsSummary: projects.rows[0],
    postsSummary: posts.rows[0],
    unusedAssets: assets.rows[0],
    pendingInquiries: inquiries.rows[0].count,
  };
}
