import test from 'node:test';
import assert from 'node:assert/strict';
import { isLocale, resolveLocale } from '../src/i18n/locale.ts';
import { errorMessages } from '../src/i18n/errors.ts';
import { ko } from '../src/i18n/ko.ts';
import { en } from '../src/i18n/en.ts';
import {
  categories,
  posts,
  getCategoryLabel,
  filterPosts,
} from '../src/content/site.ts';

test('only supported locale values are accepted', () => {
  for (const locale of ['ko', 'en']) assert.ok(isLocale(locale));
  for (const value of [undefined, '', 'fr', '__proto__', ['en'], {}]) {
    assert.equal(isLocale(value), false);
    assert.equal(resolveLocale(value), 'ko');
  }
  assert.equal(resolveLocale('en'), 'en');
});

test('UI categories translate while authored content stays in its original language', () => {
  for (const messages of [ko, en]) {
    assert.equal(messages.board.categories.length, categories.length);
    assert.equal('postItems' in messages, false);
  }
  assert.equal(getCategoryLabel('개발 기록', en), 'Development');
  assert.equal(
    filterPosts('전체', '프로젝트 오즈')[0].slug,
    'project-oz-devlog-01',
  );
  assert.equal(filterPosts('AI 정보', '프로젝트 오즈').length, 0);
  assert.match(posts[0].paragraphs[0], /2026년 10월 20일/);
});

test('404 and runtime error messages have complete translations', () => {
  assert.deepEqual(
    Object.keys(errorMessages.ko),
    Object.keys(errorMessages.en),
  );
  for (const labels of Object.values(errorMessages)) {
    for (const text of Object.values(labels)) assert.ok(text.trim());
  }
});
