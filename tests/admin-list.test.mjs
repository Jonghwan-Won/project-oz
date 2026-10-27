import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyProjectSearch,
  emptyBoardSearch,
  matchesProject,
  matchesBoard,
  paginate,
} from '../src/lib/admin-list.ts';

const project = {
  customerName: '검증고객사',
  slug: 'project-oz',
  originCode: 'personal',
  typeCode: 'website',
  lifecycle: 'BUILDING',
  isVisible: false,
  technologies: ['Next.js'],
  tags: ['포트폴리오'],
  translations: {
    ko: { title: '오즈', summary: '개인 작업실' },
    en: { title: 'OZ Studio', summary: 'Personal portfolio' },
  },
};

test('project search combines filters, includes both languages/tags, and handles unassigned fields', () => {
  assert.ok(matchesProject(project, emptyProjectSearch));
  for (const keyword of [
    '검증고객사',
    ' 오즈 ',
    'STUDIO',
    'Next.js',
    '포트폴리오',
    'project-oz',
  ])
    assert.ok(matchesProject(project, { ...emptyProjectSearch, keyword }));
  assert.ok(
    matchesProject(project, {
      ...emptyProjectSearch,
      keyword: 'studio',
      originCode: 'personal',
      typeCode: 'website',
      isVisible: 'false',
    }),
  );
  for (const patch of [
    { keyword: '없음' },
    { originCode: 'company' },
    { typeCode: 'app' },
    { isVisible: 'true' },
    { typeCode: '__unset__' },
  ])
    assert.equal(
      matchesProject(project, { ...emptyProjectSearch, ...patch }),
      false,
    );
  assert.ok(
    matchesProject(
      { ...project, typeCode: '', lifecycle: '' },
      { ...emptyProjectSearch, typeCode: '__unset__' },
    ),
  );
  assert.equal(matchesProject(project, emptyProjectSearch), true);
});

test('board search requires all conditions and an empty result remains empty', () => {
  const entry = {
    title: '시작',
    slug: 'hello',
    summary: '개발 기록',
    body: 'Next.js 사용',
    category: '소식',
    status: '공개',
  };
  assert.ok(
    matchesBoard(entry, {
      keyword: ' 개발 기록 ',
      category: '소식',
      status: '공개',
    }),
  );
  assert.equal(
    matchesBoard(entry, { ...emptyBoardSearch, keyword: 'Next.js' }),
    false,
  );
  assert.ok(matchesBoard(entry, emptyBoardSearch));
  assert.equal(
    matchesBoard(entry, { ...emptyBoardSearch, category: '다른 분류' }),
    false,
  );
  assert.equal(
    matchesBoard(entry, { ...emptyBoardSearch, status: '비공개' }),
    false,
  );
  assert.deepEqual(
    paginate(
      [entry].filter((item) =>
        matchesBoard(item, { ...emptyBoardSearch, keyword: '없음' }),
      ),
      2,
      10,
    ).items,
    [],
  );
});

test('pagination keeps order, clamps stale pages, and has a stable empty state', () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1);
  assert.deepEqual(paginate(items, 2, 10), {
    page: 2,
    totalPages: 3,
    items: items.slice(10, 20),
  });
  assert.deepEqual(paginate(items, 99, 10), {
    page: 3,
    totalPages: 3,
    items: [21, 22, 23],
  });
  assert.deepEqual(paginate([], 5, 10), { page: 1, totalPages: 1, items: [] });
  assert.equal(paginate(items, 0, 5).page, 1);
  assert.equal(paginate(items, NaN, 0).items.length, 10);
  assert.equal(paginate(items, 2, 5).items[0], 6);
});
