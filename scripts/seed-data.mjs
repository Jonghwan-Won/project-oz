import { randomUUID } from 'node:crypto';
import { projects } from '../src/content/projects.ts';
import { ko } from '../src/i18n/ko.ts';
import { en } from '../src/i18n/en.ts';

// shortcut: seed document uses heading/paragraph nodes; validate against the selected editor in phase 2.
export function documentFromSections(sections) {
  return {
    type: 'doc',
    content: sections.flatMap(({ title, body }) => [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: title }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: body }] },
    ]),
  };
}

export function initialProjects() {
  return projects.map((project) => {
    const item = ko.projectItems[project.slug];
    return {
      ...project,
      id: randomUUID(),
      title: item.title,
      summary: item.summary,
      body: documentFromSections(item.sections),
    };
  });
}

export async function seedDatabase(client) {
  await client.query('BEGIN');
  try {
    for (const [key, nameKo, nameEn, field] of [
      [
        'PROJECT_ORIGIN',
        '프로젝트 작업 구분',
        'Project origin',
        'projectOrigins',
      ],
      ['PROJECT_TYPE', '프로젝트 유형', 'Project type', 'projectTypes'],
    ]) {
      await client.query(
        'INSERT INTO "CommonCodeGroup" ("key","nameKo","nameEn","updatedAt") VALUES ($1,$2,$3,now()) ON CONFLICT DO NOTHING',
        [key, nameKo, nameEn],
      );
      for (const [position, [code, label]] of Object.entries(
        ko[field],
      ).entries()) {
        await client.query(
          'INSERT INTO "CommonCode" ("groupKey","code","nameKo","nameEn","position","updatedAt") VALUES ($1,$2,$3,$4,$5,now()) ON CONFLICT DO NOTHING',
          [key, code, label, en[field][code], position],
        );
      }
    }
    let inserted = 0;
    for (const project of initialProjects()) {
      const result = await client.query(
        'INSERT INTO "Project" ("id","slug","originCode","typeCode","lifecycle","visibility","position","placeholder","title","summary","body","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now()) ON CONFLICT ("slug") DO NOTHING RETURNING "id"',
        [
          project.id,
          project.slug,
          project.origin,
          project.type ?? null,
          project.lifecycle ?? null,
          project.visibility,
          project.order,
          project.placeholder ?? false,
          project.title,
          project.summary,
          JSON.stringify(project.body),
        ],
      );
      if (!result.rowCount) continue;
      inserted++;
    }
    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
