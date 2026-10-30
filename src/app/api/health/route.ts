import { withRequestLogging } from '@/server/logging';
export const GET = withRequestLogging('/api/health', async () =>
  Response.json(
    { status: 'ok', service: 'ddozaa', database: 'not-connected' },
    { headers: { 'Cache-Control': 'no-store' } },
  ),
);
