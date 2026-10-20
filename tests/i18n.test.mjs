import test from 'node:test';
import assert from 'node:assert/strict';
import { ko } from '../src/i18n/ko.ts';
import { en } from '../src/i18n/en.ts';

test('English has the same message keys and nonempty translations as Korean', () => {
  function compare(korean, english) {
    assert.deepEqual(Object.keys(english), Object.keys(korean));
    for (const key of Object.keys(korean)) {
      if (typeof korean[key] === 'string') {
        assert.equal(typeof english[key], 'string');
        assert.ok(english[key].trim(), key);
      } else {
        compare(korean[key], english[key]);
      }
    }
  }
  compare(ko, en);
});
