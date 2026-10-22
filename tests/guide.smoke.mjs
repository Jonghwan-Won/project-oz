import assert from 'node:assert/strict';

const base = process.env.GUIDE_TEST_URL || 'http://127.0.0.1:3000';
const home = await fetch(base);
assert.equal(home.status, 200);
const homeHeader = (await home.text()).match(
  /<header\b[\s\S]*?<\/header>/,
)?.[0];
assert.ok(homeHeader);
assert.match(homeHeader, /href="\/guide"/);
const page = await fetch(`${base}/guide`);
const ideas = await fetch(`${base}/guide/ideas`);
assert.equal(ideas.status, 200);
assert.match(await ideas.text(), /IDEA GARDEN/);
assert.equal(page.status, 200);
const guideHtml = await page.text();
assert.match(guideHtml, /개발 가이드/);
assert.match(guideHtml, /role="tablist"/);
assert.match(guideHtml, /공통 UI/);
assert.match(guideHtml, /알림 · 확인/);
assert.match(guideHtml, /개발 · 환경/);
assert.doesNotMatch(guideHtml, /OZ · MESSAGE/);
assert.match(guideHtml, /<button[^>]*aria-label="맨 위로 이동"/);
assert.doesNotMatch(guideHtml, /(?:id="page-top"|href="#page-top")/);
assert.doesNotMatch(guideHtml, /href="\/guide\/alert-designs"/);
for (const route of [
  '/admin',
  '/admin/projects',
  '/admin/board',
  '/admin/categories',
  '/admin/media',
  '/admin/settings',
]) {
  const response = await fetch(`${base}${route}`);
  assert.equal(response.status, 200, route);
  const html = (await response.text()).replace(/<!--.*?-->/g, '');
  assert.match(html, /DEVELOPMENT ADMIN/);
  assert.match(
    html,
    /DB 저장·실제 사이트 반영·파일 업로드는 연결하지 않았습니다/,
  );
  if (route === '/admin/projects') assert.match(html, /프로젝트 등록/);
  if (route === '/admin/board') assert.match(html, /게시글 등록/);
}
assert.equal((await fetch(`${base}/admin/unknown`)).status, 404);
const designs = await fetch(`${base}/guide/alert-designs`);
assert.equal(designs.status, 404);
const markdown = await fetch(`${base}/guide/markdown`);
assert.equal(markdown.status, 200);
const markdownHtml = await markdown.text();
assert.match(markdownHtml, /Markdown 뷰어/);
assert.match(markdownHtml, /11-environment\.md/);
const environment = await fetch(`${base}/guide/environment`);
assert.equal(environment.status, 200);
const environmentHtml = await environment.text();
assert.match(environmentHtml, /OZ ENVIRONMENT/);
assert.match(environmentHtml, /id="network"/);
assert.match(environmentHtml, /id="history"/);
assert.match(environmentHtml, /network-map-title/);
assert.match(environmentHtml, /id="production-db"/);
assert.match(environmentHtml, /Docker 대신 Actions/);
const api = await fetch(`${base}/api/guide?check=api`);
assert.equal(api.status, 200);
assert.match(api.headers.get('cache-control'), /no-store/);
const body = await api.json();
assert.equal(body.ok, true);
assert.ok(Number.isFinite(Date.parse(body.serverTime)));
const invalid = await fetch(`${base}/api/guide?check=unknown`);
assert.equal(invalid.status, 400);
assert.equal((await invalid.json()).ok, false);
const db = await fetch(`${base}/api/guide?check=database`);
assert.ok([200, 503].includes(db.status));
const dbBody = await db.json();
assert.equal(dbBody.ok, db.status === 200);
assert.equal(typeof dbBody.message, 'string');
assert.deepEqual(Object.keys(dbBody).sort(), ['message', 'ok']);
console.log(
  `Guide smoke passed; DB check HTTP ${db.status} (200=connected, 503=not connected).`,
);
