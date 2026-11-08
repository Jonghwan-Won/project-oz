import test from 'node:test';
import assert from 'node:assert/strict';
import { technologyName } from '../src/lib/technology-name.ts';

test('stack aliases merge without merging distinct Spring products', () => {
  assert.equal(technologyName('Spring'), 'Spring Framework');
  assert.equal(technologyName('Material UI'), 'MUI');
  assert.equal(technologyName('GitHub Action'), 'GitHub Actions');
  for (const name of ['Spring Boot', 'Spring Security', 'GitHub Actions'])
    assert.equal(technologyName(name), name);
});
