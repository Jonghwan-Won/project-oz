import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialProjects,
  documentFromSections,
  seedDatabase,
} from '../scripts/seed-data.mjs';

test('seed preserves all source projects, original project content and document text', () => {
  const projects = initialProjects();
  assert.equal(projects.length, 8);
  assert.equal(new Set(projects.map((p) => p.slug)).size, projects.length);
  for (const project of projects) {
    assert.ok(project.title.trim());
    assert.equal(project.body.type, 'doc');
    assert.ok(!('translations' in project));
  }
  assert.deepEqual(
    documentFromSections([{ title: '제목', body: '원문\n내용' }]).content.map(
      (n) => n.content[0].text,
    ),
    ['제목', '원문\n내용'],
  );
});

test('seed skips existing projects and rolls back failures', async () => {
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql);
      return { rowCount: 0 };
    },
  };
  assert.equal(await seedDatabase(client), 0);
  assert.equal(
    queries.filter((sql) => sql.startsWith('INSERT INTO "Project" ')).length,
    8,
  );
  assert.equal(queries.at(-1), 'COMMIT');
  queries.length = 0;
  client.query = async (sql) => {
    queries.push(sql);
    if (sql.startsWith('INSERT')) throw new Error('test failure');
  };
  await assert.rejects(seedDatabase(client), /test failure/);
  assert.equal(queries.at(-1), 'ROLLBACK');
});
