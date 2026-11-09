/**
 * 로그인 후 돌아갈 경로를 같은 사이트의 내부 경로로만 허용한다.
 * 외부 주소(https://…, //host), 역슬래시 우회, 로그인·API 경로는 '/'로 바꾼다.
 */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || value.length > 512) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  if (/[\\\s]/.test(value)) return '/';
  const pathname = value.split(/[?#]/)[0];
  if (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/api' ||
    pathname.startsWith('/api/')
  )
    return '/';
  return value;
}

/** `next`가 없을 때 Referer가 같은 호스트면 그 경로를 돌아갈 곳으로 쓴다. */
export function returnPathFromReferer(
  referer: string | null,
  host: string | null,
): string {
  if (!referer || !host) return '/';
  try {
    const url = new URL(referer);
    if (url.host !== host) return '/';
    return safeReturnPath(url.pathname + url.search + url.hash);
  } catch {
    return '/';
  }
}
