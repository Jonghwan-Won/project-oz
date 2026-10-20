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
  const hidden = { ...item, visibility: 'PRIVATE', type: 'internal-only' };
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

test('latest projects follow the supplied order and home selects only two', () => {
  const sorted = getPublicProjects([...projects].reverse());
  assert.deepEqual(
    sorted.map((project) => ko.projectItems[project.slug].title),
    [
      'ddoza',
      'AK아이에스',
      '제주항공',
      '서플러스글로벌',
      'NH오늘농사',
      '농협몰',
      '모임',
      '조공',
    ],
  );
  assert.deepEqual(
    sorted.slice(0, 2).map((project) => project.slug),
    ['project-oz', 'ak-is'],
  );
  assert.ok(
    sorted
      .slice(1)
      .every((project) => project.placeholder && !project.lifecycle),
  );
});
