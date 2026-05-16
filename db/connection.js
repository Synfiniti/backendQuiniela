import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

try {
  // Probar conexión
  const client = await db.connect();
  console.log('✅ Conexión exitosa a Supabase PostgreSQL (Pool)');
  client.release();
} catch (error) {
  console.error('❌ Error conectando a Supabase:', error.message);
  process.exit(1);
}

export default db;