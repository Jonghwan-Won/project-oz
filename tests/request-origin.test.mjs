import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRequestOrigin } from './request-origin-helper.mjs';
test('configured public origin works behind a proxy and rejects foreign or missing origins', () => {
  const { hasSameOrigin } = loadRequestOrigin('https://www.ddozaa.com');
  const request = (origin) =>
    new Request('http://127.0.0.1:3000/api/assets', {
      headers: origin ? { origin } : {},
    });
  assert.equal(hasSameOrigin(request('https://www.ddozaa.com')), true);
  assert.equal(hasSameOrigin(request('https://other.example')), false);
  assert.equal(hasSameOrigin(request()), false);
  assert.equal(hasSameOrigin(request('null')), false);
  assert.equal(
    loadRequestOrigin('').hasSameOrigin(request('https://www.ddozaa.com')),
    false,
  );
});
