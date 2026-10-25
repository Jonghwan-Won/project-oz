import test from 'node:test';
import assert from 'node:assert/strict';
import {
  projects,
  getPublicProjects,
  getUsedProjectTypes,
} from '../src/content/projects.ts';
import { ko } from '../src/i18n/ko.ts';

test('only public projects and their distinct types are exposed', () => {
  const item = projects[0];
  const hidden = { ...item, isVisible: false, type: 'internal-only' };
  assert.deepEqual(getPublicProjects([hidden, item]), [item]);
  assert.deepEqual(getUsedProjectTypes([hidden, item, item]), ['website']);
  assert.deepEqual(getUsedProjectTypes([hidden]), []);
  assert.deepEqual(getPublicProjects([]), []);
});

test('registered projects have translated codes and content', () => {
  assert.equal(
    new Set(projects.map((project) => project.slug)).size,
    projects.length,
  );
  for (const project of projects) {
    if (project.type) assert.ok(ko.projectTypes[project.type]);
    assert.ok(ko.projectOrigins[project.origin]);
    if (project.lifecycle) assert.ok(ko.projectStatuses[project.lifecycle]);
    assert.ok(ko.projectItems[project.slug].title);
  }
});

test('projects sort by latest start date and home selects only two', () => {
  const sorted = getPublicProjects([...projects].reverse());
  assert.deepEqual(
    sorted.map((project) => ko.projectItems[project.slug].title),
    [
      'ddoza',
      'AK아이에스 S&OP 사업관리 시스템 개발',
      '제주항공 기내 통합운영 시스템 고도화',
      '서플러스글로벌 SemiMarket 구축 및 고도화',
      '농협 오늘농사 영농 특화 하이브리드 앱 개발',
      '농협몰 고도화',
      '모임 · 생활공간대여 플랫폼 MoiM!',
      '조공 선물하기 플랫폼, Jogong!',
    ],
  );
  assert.deepEqual(
    sorted.slice(0, 2).map((project) => project.slug),
    ['project-oz', 'ak-is'],
  );
  assert.ok(sorted.slice(1).every((project) => !project.placeholder));
  assert.deepEqual(
    sorted.slice(1).map(({ startedOn, endedOn }) => [startedOn, endedOn]),
    [
      ['2026-06-01', undefined],
      ['2026-02-01', '2026-06-01'],
      ['2024-11-01', '2025-12-01'],
      ['2024-01-01', '2024-10-01'],
      ['2023-02-01', '2023-12-01'],
      ['2022-11-05', '2022-12-09'],
      ['2022-09-18', '2022-10-16'],
    ],
  );
});
