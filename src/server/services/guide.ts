import 'server-only';
import pg from 'pg';

const defaultMessages = {
  databaseUrlMissing: 'DATABASE_URL을 설정해 주세요.',
  databaseSuccess: '개발 DB 연결 성공 · SELECT 1 완료',
  databaseFailure: 'DB 연결 실패: SSH 터널과 접속 정보를 확인해 주세요.',
};

export async function checkGuideDatabase(
  messages: typeof defaultMessages = defaultMessages,
) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return {
      status: 503,
      body: { ok: false, message: messages.databaseUrlMissing },
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
      body: { ok: true, message: messages.databaseSuccess },
    };
  } catch {
    return {
      status: 503,
      body: {
        ok: false,
        message: messages.databaseFailure,
      },
    };
  } finally {
    await client.end().catch(() => {});
  }
}
