import assert from 'node:assert/strict';

const response = await fetch(new URL('/portfolio', process.env.BASE_URL || 'http://127.0.0.1:3000'));
assert.equal(response.status, 200);
const html = await response.text();
assert.match(html, /<title>원종환 \| 풀스택 개발자 포트폴리오<\/title>/);
for (const section of ['profile', 'projects', 'works']) {
  assert.ok(html.includes('href="#' + section + '"'));
  assert.ok(html.includes('id="' + section + '"'));
}
assert.match(html, /rel="icon"[^>]*href="\/portfolio\/icon\.svg/);
