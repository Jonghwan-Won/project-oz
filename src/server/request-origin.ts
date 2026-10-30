import 'server-only';

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const siteUrl = process.env.BETTER_AUTH_URL;
  if (!origin || !siteUrl) return false;
  try {
    return new URL(origin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}
