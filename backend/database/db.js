const { Pool } = require('pg');

let pool = null;

function hasDatabaseConnection() {
  return Boolean(process.env.DATABASE_URL);
}

function createPool() {
  if (!hasDatabaseConnection()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const newPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  newPool.on('error', (error) => {
    console.error('PostgreSQL pool error:', error.message);
    pool = null;
  });

  return newPool;
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }

  return pool;
}

function isReconnectableError(error) {
  return [
    '57P01',
    '57P02',
    '57P03',
    '08006',
    '08001',
    '08003',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EPIPE',
  ].includes(error?.code);
}

async function query(text, params = []) {
  const currentPool = getPool();

  try {
    return await currentPool.query(text, params);
  } catch (error) {
    if (isReconnectableError(error)) {
      try {
        if (pool) {
          await pool.end().catch(() => {});
        }
      } finally {
        pool = null;
      }

      const retryPool = getPool();
      return retryPool.query(text, params);
    }

    throw error;
  }
}

async function initializeDatabase() {
  if (!hasDatabaseConnection()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  await query(`
    CREATE TABLE IF NOT EXISTS analyses (
      id UUID PRIMARY KEY,
      region TEXT,
      resources_scanned INTEGER,
      issues_found INTEGER,
      estimated_monthly_savings TEXT,
      estimated_annual_savings TEXT,
      health_score INTEGER,
      analysis_result JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

module.exports = {
  query,
  initializeDatabase,
};