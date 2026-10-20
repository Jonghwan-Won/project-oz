import 'server-only';
import pg from 'pg';

export async function checkGuideDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return {
      status: 503,
      body: { ok: false, message: 'DATABASE_URL을 설정해 주세요.' },
    };
  }

  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 3000,
    query_timeout: 3000,
    statement_timeout: 3000,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return {
      status: 200,
      body: { ok: true, message: '개발 DB 연결 성공 · SELECT 1 완료' },
    };
  } catch {
    return {
      status: 503,
      body: {
        ok: false,
        message: 'DB 연결 실패: SSH 터널과 접속 정보를 확인해 주세요.',
      },
    };
  } finally {
    await client.end().catch(() => {});
  }
}
