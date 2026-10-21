import test from 'node:test';
import assert from 'node:assert/strict';
import { createOzParticles } from '../src/components/oz-particles.ts';

test('OZ particles have stable finite letter and sphere positions for desktop and mobile', () => {
  for (const count of [1, 1300, 2600]) {
    const points = createOzParticles(count);
    assert.equal(points.length, count);
    assert.deepEqual(points, createOzParticles(count));
    for (const point of points) {
      assert.ok(Object.values(point).every(Number.isFinite));
      assert.ok(point.size > 0);
      assert.ok(
        Math.abs(
          Math.hypot(point.sphereX, point.sphereY, point.sphereZ) - 166,
        ) < 0.001,
      );
    }
  }
  assert.deepEqual(createOzParticles(0), []);
});

test('both rounded letters stay close to square proportions', () => {
  const points = createOzParticles(2600);
  for (const letter of [points.slice(0, 1430), points.slice(1430)]) {
    const width =
      Math.max(...letter.map((point) => point.x)) -
      Math.min(...letter.map((point) => point.x));
    const height =
      Math.max(...letter.map((point) => point.y)) -
      Math.min(...letter.map((point) => point.y));
    assert.ok(width / height > 0.9 && width / height < 1.1);
  }
  const gap =
    Math.min(...points.slice(1430).map((point) => point.x)) -
    Math.max(...points.slice(0, 1430).map((point) => point.x));
  assert.ok(gap > 0 && gap < 20);
});
