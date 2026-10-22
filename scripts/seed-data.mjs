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
      ['TECHNOLOGY', '사용 기술', 'Technologies', null],
    ]) {
      await client.query(
        'INSERT INTO "CommonCodeGroup" ("key","nameKo","nameEn","updatedAt") VALUES ($1,$2,$3,now()) ON CONFLICT DO NOTHING',
        [key, nameKo, nameEn],
      );
      const values = field
        ? Object.entries(ko[field]).map(([code, label]) => [
            code,
            label,
            en[field][code],
          ])
        : [
            ['REACT', 'React', 'React'],
            ['NEXT_JS', 'Next.js', 'Next.js'],
            ['POSTGRESQL', 'PostgreSQL', 'PostgreSQL'],
          ];
      for (const [position, [code, label, labelEn]] of values.entries()) {
        await client.query(
          'INSERT INTO "CommonCode" ("groupKey","code","nameKo","nameEn","position","updatedAt") VALUES ($1,$2,$3,$4,$5,now()) ON CONFLICT DO NOTHING',
          [key, code, label, labelEn, position],
        );
      }
    }
    let inserted = 0;
    for (const project of initialProjects()) {
      const result = await client.query(
        'INSERT INTO "Project" ("id","slug","customerName","originCode","typeCode","lifecycle","visibility","position","placeholder","startedOn","endedOn","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now()) ON CONFLICT ("slug") DO NOTHING RETURNING "id"',
        [
          project.id,
          project.slug,
          project.customerName ?? '',
          project.origin,
          project.type ?? null,
          project.lifecycle ?? null,
          project.visibility,
          project.order,
          project.placeholder ?? false,
          project.startedOn ?? null,
          project.endedOn ?? null,
        ],
      );
      if (result.rowCount) inserted++;
      await client.query(
        'INSERT INTO "ProjectTranslation" ("projectId",locale,title,summary,body) SELECT id,$2,$3,$4,$5 FROM "Project" WHERE slug=$1 ON CONFLICT DO NOTHING',
        [
          project.slug,
          'ko',
          project.title,
          project.summary,
          JSON.stringify(project.body),
        ],
      );
      const english = en.projectItems[project.slug];
      await client.query(
        'INSERT INTO "ProjectTranslation" ("projectId",locale,title,summary,body) SELECT id,$2,$3,$4,$5 FROM "Project" WHERE slug=$1 ON CONFLICT DO NOTHING',
        [
          project.slug,
          'en',
          english.title,
          english.summary,
          JSON.stringify(documentFromSections(english.sections)),
        ],
      );
    }
    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
