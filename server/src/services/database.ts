import { Pool, PoolClient } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params)
}

export const getClient = async () => {
  return pool.connect()
}

export const closePool = () => {
  return pool.end()
}

export default pool
