import 'server-only';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export async function getGuideDocuments() {
  if (process.env.NODE_ENV !== 'development') return [];
  const entries = await readdir(path.join(process.cwd(), 'docs'), {
    withFileTypes: true,
  });
  const files = entries
    .filter((entry) => entry.isFile() && /^\d{2}-[\w-]+\.md$/.test(entry.name))
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
