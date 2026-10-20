import test from 'node:test';
import assert from 'node:assert/strict';
import { isTheme, resolveTheme } from '../src/theme/theme.ts';

test('only dark and light themes are accepted, unknown preferences fall back to dark', () => {
  for (const theme of ['dark', 'light']) {
    assert.equal(isTheme(theme), true);
    assert.equal(resolveTheme(theme), theme);
  }
  for (const value of [undefined, '', 'system', '__proto__', ['light'], {}]) {
    assert.equal(isTheme(value), false);
    assert.equal(resolveTheme(value), 'dark');
  }
});
