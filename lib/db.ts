import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
// Default to mock mode when no database is configured (e.g. Vercel deploy without DATABASE_URL)
const useMockData = process.env.USE_MOCK_DATA === 'true' || !connectionString;

if (!useMockData && !connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and add your PostgreSQL connection string. Or set USE_MOCK_DATA=true for UI mock mode.'
  );
}

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null;

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  if (!pool) {
    throw new Error('Database not configured. Use USE_MOCK_DATA=true for mock mode.');
  }
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[DB] Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
}

export async function getClient() {
  if (!pool) throw new Error('Database not configured.');
  return pool.connect();
}

export async function closePool() {
  if (pool) await pool.end();
}
