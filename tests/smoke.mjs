import assert from 'node:assert/strict';
const base = process.env.TEST_URL || 'http://localhost:3000';
const home = await (await fetch(base + '/')).text();
assert.match(home, /둥근 OZ와 구체 사이를 오가는/);
assert.doesNotMatch(home, /OZ 입자 모션 일시정지|aria-pressed=/);
assert.match(home, /또자와 OZ 알아보기/);
assert.doesNotMatch(home, /01 \/ POSSIBILITY|OZ \/ A WORLD IN THE MAKING/);
const credits = home.match(
  /<section[^>]*aria-labelledby="credits-heading"[\s\S]*?<\/section>/,
)?.[0];
assert.ok(credits);
assert.doesNotMatch(credits, /<a\b|↗|나의 유리구두<|AI 개발 도구/);
for (const name of [
  'Codex',
  'React',
  'Next.js',
  'TypeScript',
  'Synology',
  'Docker',
])
  assert.ok(credits.includes(name));
assert.match(credits, /유리구두들입니다/);
const about = await (await fetch(base + '/about')).text();
assert.match(about, /금방 또 잠들어서/);
assert.match(about, /별명 하나에서 시작된 세계/);
assert.match(about, /유리구두는 하나가 아닙니다/);
assert.match(about, /블루·바이올렛 입자가 모여 만든 둥근 OZ/);
assert.match(about, /만들고 있는 프로젝트/);
assert.match(about, /쌓아가는 기록 보기/);
assert.doesNotMatch(about, /oz-two-worlds\.webp|aria-pressed=/);
for (const section of ['about', 'projects', 'board', 'help']) {
  assert.ok(home.includes(`id="${section}"`), `${section} section exists`);
  assert.ok(
    home.includes(`href="/#${section}"`),
    `${section} menu targets home section`,
  );
}
assert.ok(!home.includes('id="lab"'));
assert.ok(!home.includes('href="/#lab"'));
assert.match(home, /href="\/work\/project-oz"/);
assert.match(home, /href="\/work\/ak-is"/);
assert.ok(
  !home.includes('href="/work/jeju-air"'),
  'home shows only the latest two projects',
);
const projectsPage = await (await fetch(base + '/projects')).text();
assert.match(projectsPage, /href="\/work\/project-oz"/);
assert.match(projectsPage, /개발 중/);
assert.ok(
  !projectsPage.includes('aria-label="프로젝트 유형"'),
  'one type needs no filter',
);
assert.match(
  await (await fetch(base + '/projects?category=unknown')).text(),
  /AK아이에스/,
);
const lab = await fetch(base + '/lab');
assert.equal(lab.status, 200);
assert.match(await lab.text(), /실험실/);
for (const route of [
  '/',
  '/about',
  '/projects',
  '/lab',
  '/board',
  '/board/hello-oz',
  '/board/project-oz-devlog-01',
  '/work/project-oz',
  '/help',
  '/login',
]) {
  const result = await fetch(base + route);
  assert.equal(result.status, 200, route);
  assert.match(await result.text(), /ddoza/);
}
for (const route of ['/admin', '/admin/posts']) {
  const result = await fetch(base + route, { redirect: 'manual' });
  if (process.env.SMOKE_PRODUCTION === '1') {
    assert.equal(result.status, 307);
    assert.equal(result.headers.get('location'), '/login');
  } else {
    assert.equal(result.status, route === '/admin' ? 200 : 404);
  }
}
for (const route of ['/board/missing', '/work/missing'])
  assert.equal((await fetch(base + route)).status, 404);
assert.match(
  await (
    await fetch(base + '/board?category=' + encodeURIComponent('AI 정보'))
  ).text(),
  /아직 기록이 없어요/,
);
assert.equal((await (await fetch(base + '/api/health')).json()).status, 'ok');
for (const route of [
  '/',
  '/about',
  '/projects',
  '/work/project-oz',
  '/board',
  '/board/hello-oz',
  '/board/project-oz-devlog-01',
  '/help',
  '/login',
  '/error',
  '/missing-page',
]) {
  const english = await fetch(base + route, {
    headers: { Cookie: 'ddoza-locale=en' },
  });
  assert.equal(english.status, route === '/missing-page' ? 404 : 200, route);
  const html = await english.text();
  assert.match(html, /<html lang="en"/, route);
  assert.match(html, /한국어로 전환/, route);
  assert.ok(
    route.startsWith('/board/') || !/<h1[^>]*>[^<]*[가-힣]/.test(html),
    `${route} title is translated`,
  );
  if (route === '/missing-page')
    assert.match(html, /This page is out of reach/);
}
const invalidLocale = await (
  await fetch(base, { headers: { Cookie: 'ddoza-locale=invalid' } })
).text();
assert.match(invalidLocale, /<html lang="ko"/);
for (const theme of ['dark', 'light']) {
  for (const locale of ['ko', 'en']) {
    const result = await fetch(base + '/error', {
      headers: { Cookie: `ddoza-theme=${theme}; ddoza-locale=${locale}` },
    });
    const html = await result.text();
    assert.equal(result.status, 200);
    assert.match(html, new RegExp(`data-theme="${theme}"`));
    assert.match(html, new RegExp(`lang="${locale}"`));
    assert.ok(!html.includes('앗!'));
    assert.ok(!html.includes('viewBox="0 0 140 140"'), 'error globe removed');
  }
}
const invalidTheme = await (
  await fetch(base, { headers: { Cookie: 'ddoza-theme=invalid' } })
).text();
assert.match(invalidTheme, /data-theme="dark"/);
console.log(
  'Routes, empty category, health, missing content and admin redirects passed.',
);

for (const slug of [
  'ak-is',
  'jeju-air',
  'surplus-global',
  'nh-farming',
  'nonghyup-mall',
  'moim',
  'jogong',
]) {
  assert.ok(projectsPage.includes('href="/work/' + slug + '"'));
  const detail = await fetch(base + '/work/' + slug);
  assert.equal(detail.status, 200);
  assert.match(await detail.text(), /제목과 배치 확인을 위한 임시 데이터/);
}

for (const slug of ['hello-oz', 'project-oz-devlog-01']) {
  const koPage = await (
    await fetch(base + '/board/' + slug, {
      headers: { Cookie: 'ddoza-locale=ko' },
    })
  ).text();
  const enPage = await (
    await fetch(base + '/board/' + slug, {
      headers: { Cookie: 'ddoza-locale=en' },
    })
  ).text();
  assert.equal(
    koPage.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1],
    enPage.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1],
  );
  assert.match(enPage, /Back to board/);
}
