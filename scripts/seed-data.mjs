import { createHash, randomUUID } from 'node:crypto';
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
            ['TYPESCRIPT', 'TypeScript', 'TypeScript'],
            ['JAVASCRIPT', 'JavaScript', 'JavaScript'],
            ['HTML', 'HTML', 'HTML'],
            ['CSS', 'CSS', 'CSS'],
            ['TAILWIND_CSS', 'Tailwind CSS', 'Tailwind CSS'],
            ['VUE_JS', 'Vue.js', 'Vue.js'],
            ['ANGULAR', 'Angular', 'Angular'],
            ['NODE_JS', 'Node.js', 'Node.js'],
            ['JAVA', 'Java', 'Java'],
            ['SPRING_BOOT', 'Spring Boot', 'Spring Boot'],
            ['PYTHON', 'Python', 'Python'],
            ['DJANGO', 'Django', 'Django'],
            ['FASTAPI', 'FastAPI', 'FastAPI'],
            ['CSHARP', 'C#', 'C#'],
            ['DOTNET', '.NET', '.NET'],
            ['POSTGRESQL', 'PostgreSQL', 'PostgreSQL'],
            ['MYSQL', 'MySQL', 'MySQL'],
            ['MARIADB', 'MariaDB', 'MariaDB'],
            ['MONGODB', 'MongoDB', 'MongoDB'],
            ['REDIS', 'Redis', 'Redis'],
            ['AWS', 'AWS', 'AWS'],
            ['DOCKER', 'Docker', 'Docker'],
            ['KUBERNETES', 'Kubernetes', 'Kubernetes'],
            ['GIT', 'Git', 'Git'],
            ['GITHUB', 'GitHub', 'GitHub'],
            ['LINUX', 'Linux', 'Linux'],
            ['NGINX', 'Nginx', 'Nginx'],
            ['PRISMA', 'Prisma', 'Prisma'],
            ['MANTINE', 'Mantine', 'Mantine'],
            ['TIPTAP', 'Tiptap', 'Tiptap'],
            ['AWS_S3', 'AWS S3', 'AWS S3'],
            ['JPA', 'JPA', 'JPA'],
            ['JSP', 'JSP', 'JSP'],
            ['KAKAO_MAP_API', 'Kakao Map API', 'Kakao Map API'],
            ['MSSQL', 'MSSQL', 'MSSQL'],
            ['MUI', 'MUI', 'MUI'],
            ['MATERIAL_UI', 'Material UI', 'Material UI'],
            ['MYBATIS', 'MyBatis', 'MyBatis'],
            ['NEXACRO', 'Nexacro', 'Nexacro'],
            ['NUXT_JS', 'Nuxt.js', 'Nuxt.js'],
            ['ORACLE', 'Oracle', 'Oracle'],
            ['QUERYDSL', 'QueryDSL', 'QueryDSL'],
            ['REDUX', 'Redux', 'Redux'],
            ['SPRING', 'Spring', 'Spring'],
            ['SPRING_FRAMEWORK', 'Spring Framework', 'Spring Framework'],
            ['SPRING_SECURITY', 'Spring Security', 'Spring Security'],
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
        'INSERT INTO "Project" ("id","slug","customerName","originCode","typeCode","lifecycle","isVisible","placeholder","startedOn","endedOn","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()) ON CONFLICT ("slug") DO NOTHING RETURNING "id"',
        [
          project.id,
          project.slug,
          project.customerName ?? '',
          project.origin,
          project.type ?? null,
          project.lifecycle ?? null,
          project.isVisible,
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
      for (const [position, name] of (project.technologies ?? []).entries()) {
        const slug = createHash('sha256')
          .update(name.normalize('NFKC').toLowerCase())
          .digest('hex');
        await client.query(
          'INSERT INTO "Tag" (id,kind,slug,name) VALUES ($1,$2,$3,$4) ON CONFLICT (kind,slug) DO NOTHING',
          [randomUUID(), 'TECHNOLOGY', slug, name],
        );
        const tag = (
          await client.query('SELECT id FROM "Tag" WHERE kind=$1 AND slug=$2', [
            'TECHNOLOGY',
            slug,
          ])
        ).rows[0];
        await client.query(
          'INSERT INTO "ProjectTag" ("projectId","tagId",position) SELECT id,$2,$3 FROM "Project" WHERE slug=$1 ON CONFLICT DO NOTHING',
          [project.slug, tag.id, position],
        );
      }
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
