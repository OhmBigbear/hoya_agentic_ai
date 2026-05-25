const DEFAULT_QUERY_TIMEOUT_MS = 15000;

export class MissingDatabaseUrlError extends Error {
  constructor() {
    super('DATABASE_URL is required to start the maintenance API.');
    this.name = 'MissingDatabaseUrlError';
    this.statusCode = 503;
    this.errorCode = 'DATABASE_URL_MISSING';
  }
}

export function assertDatabaseUrl(env = process.env) {
  if (!env.DATABASE_URL?.trim()) {
    throw new MissingDatabaseUrlError();
  }
}

export async function createPostgresPoolFromEnv(env = process.env) {
  assertDatabaseUrl(env);
  const { Pool } = await import('pg');

  return new Pool({
    connectionString: env.DATABASE_URL,
    max: Number(env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: Number(env.PGPOOL_IDLE_TIMEOUT_MS ?? 30000),
    connectionTimeoutMillis: Number(env.PGPOOL_CONNECTION_TIMEOUT_MS ?? 5000),
    query_timeout: Number(env.PGQUERY_TIMEOUT_MS ?? DEFAULT_QUERY_TIMEOUT_MS),
    statement_timeout: Number(env.PGSTATEMENT_TIMEOUT_MS ?? DEFAULT_QUERY_TIMEOUT_MS),
    application_name: 'hoya-ui-maintenance-api',
  });
}

export function createDb(pool) {
  return {
    query(text, values = []) {
      return pool.query({ text, values });
    },
    end() {
      return pool.end();
    },
  };
}

export function mapDbError(error) {
  if (error instanceof MissingDatabaseUrlError) {
    return {
      statusCode: error.statusCode,
      code: error.errorCode,
      message: error.message,
    };
  }

  const pgCode = typeof error?.code === 'string' ? error.code : undefined;
  if (pgCode === '57014') {
    return { statusCode: 504, code: 'DATABASE_TIMEOUT', message: 'Database query timed out.' };
  }

  if (pgCode === '42P01' || pgCode === '42703') {
    return { statusCode: 503, code: 'DATABASE_SCHEMA_UNAVAILABLE', message: 'Maintenance database schema or view is unavailable.' };
  }

  return { statusCode: 500, code: 'DATABASE_ERROR', message: 'Maintenance database query failed.' };
}
