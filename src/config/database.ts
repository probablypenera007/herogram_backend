import { Pool } from 'pg';
import { createClient, RedisClientType } from '@redis/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// PostgreSQL config
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis client setup
export const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err: unknown) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Client Connected');
});

// Wrap connect in a function to avoid top-level await
export async function initializeRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

// Redis helpers
export const redisGet = async (key: string) => await redisClient.get(key);
export const redisSet = async (key: string, value: string) => await redisClient.set(key, value);
export const redisDel = async (key: string) => await redisClient.del(key);

// PostgreSQL schema bootstrap
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    const schema = readFileSync(join(__dirname, '../models/schema.sql'), 'utf8');
    await client.query(schema);
    console.log('📦 Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}