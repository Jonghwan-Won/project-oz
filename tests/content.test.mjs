import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, filterPosts, posts } from '../src/content/site.ts';
test('category and query must both match; empty results never fall back to all posts', () => {
  assert.equal(filterPosts('전체', ' OZ ').length, 1);
  assert.equal(filterPosts('개발 기록', 'ddozaa').length, 1);
  assert.equal(filterPosts('AI 정보', 'OZ').length, 0);
  assert.equal(filterPosts('전체', '<script>').length, 0);
  assert.equal(new Set(posts.map((p) => p.slug)).size, posts.length);
  for (const post of posts) assert.ok(categories.includes(post.category));
});
