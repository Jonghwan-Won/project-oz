import 'server-only';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { headers } from 'next/headers';
import { getAdminSession } from '@/server/auth';

export async function getGuideDocuments() {
  if (!(await getAdminSession(await headers()))) return [];
  const entries = await readdir(path.join(process.cwd(), 'docs'), {
    withFileTypes: true,
  }).catch((error: unknown) => {
    // Optional server documents must not break the local-file Markdown viewer.
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return [];
    throw error;
  });
  if (entries.length === 0) return [];
  const files = entries
    .filter(
      (entry) =>
        entry.isFile() && /^\d{2}-[\p{L}\p{N}-]+\.md$/u.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort();
  return [
    {
      name: 'README.md',
      content: await readFile(path.join(process.cwd(), 'README.md'), 'utf8'),
    },
    ...(await Promise.all(
      files.map(async (name) => ({
        name: `docs/${name}`,
        content: await readFile(path.join(process.cwd(), 'docs', name), 'utf8'),
      })),
    )),
  ];
}
