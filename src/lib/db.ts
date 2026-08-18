import { Pool } from 'pg';

declare global {
  var globalPool: Pool | undefined;
}

const pool = globalThis.globalPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon secure server connections
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalPool = pool;
}

export default pool;
