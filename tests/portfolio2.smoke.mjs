import assert from 'node:assert/strict';

const response = await fetch(
  new URL('/', process.env.BASE_URL || 'http://127.0.0.1:3000'),
);
assert.equal(response.status, 200);
const html = await response.text();
assert.match(html, /<title>원종환 \| 풀스택 개발자 포트폴리오<\/title>/);
for (const section of ['profile', 'projects', 'works']) {
  assert.ok(html.includes('href="/#' + section + '"'), section + ' link');
  assert.ok(html.includes('id="' + section + '"'), section + ' section');
}
assert.ok(html.includes('풀스택 개발자 원종환 포트폴리오'), 'h1');
assert.ok(html.includes('스크롤'), 'scroll prompt');
assert.ok(html.includes('직무 연관 이력'), 'career');
assert.ok(
  html.includes('이력서.pdf') && html.includes('포트폴리오.pdf'),
  'downloads',
);
assert.match(html, /rel="icon"[^>]*href="\/icon\.svg/);
console.log('home portfolio smoke ok');
