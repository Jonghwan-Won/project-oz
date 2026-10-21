import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createIdea,
  initialIdeas,
  mapLayout,
  reorderIdeas,
  initialBranches,
} from '../src/app/guide/ideas/model.ts';

test('idea capture keeps original content and derives a bounded first-line title', () => {
  const content = '  첫 생각\n자유로운 내용과 <script>문자</script>  ';
  const idea = createIdea(content, '미분류', 'new');
  assert.equal(idea.title, '첫 생각');
  assert.equal(idea.content, content);
  assert.equal(idea.category, '미분류');
  assert.equal(idea.status, '아이디어');
  assert.equal(createIdea('가'.repeat(100), '개발', 'long').title.length, 60);
  assert.throws(() => createIdea(' \n ', '개발', 'empty'));
  assert.throws(() => createIdea('가'.repeat(3001), '개발', 'large'));
});

test('priority moves preserve all ideas and reject invalid positions', () => {
  const result = reorderIdeas(initialIdeas, 'IDEA-004', 1);
  assert.equal(result[0].id, 'IDEA-004');
  assert.equal(initialIdeas[0].id, 'IDEA-001');
  assert.equal(
    new Set(result.map((idea) => idea.id)).size,
    initialIdeas.length,
  );
  assert.equal(reorderIdeas(result, 'IDEA-004', 4)[3].id, 'IDEA-004');
  for (const position of [0, 5, 1.5, NaN])
    assert.throws(() => reorderIdeas(initialIdeas, 'IDEA-001', position));
  assert.throws(() => reorderIdeas(initialIdeas, 'missing', 1));
  assert.ok(
    initialBranches.every((branch) =>
      initialIdeas.some((idea) => idea.id === branch.ideaId),
    ),
  );
});

test('mind map gives every idea a distinct position inside its canvas', () => {
  for (const count of [0, 1, initialIdeas.length, 5, 20]) {
    const layout = mapLayout(count);
    assert.equal(layout.nodes.length, count);
    assert.equal(
      new Set(layout.nodes.map(({ left, top }) => `${left}:${top}`)).size,
      count,
    );
    for (const node of layout.nodes) {
      assert.ok(node.left >= 0 && node.left + 280 <= 860);
      assert.ok(node.top >= 0 && node.top + 100 <= layout.height);
    }
  }
});
