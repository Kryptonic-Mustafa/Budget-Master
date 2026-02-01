import mysql from 'mysql2/promise';

// Create a connection pool
// This is more efficient than creating a single connection for every request
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Max concurrent connections
  queueLimit: 0,
});

// Helper function to execute queries safely
export async function query({ query, values = [] }: { query: string; values?: any[] }) {
  try {
    const [results] = await pool.execute(query, values);
    return results;
  } catch (error: any) {
    console.error('❌ Database Error:', error.message);
    throw new Error(error.message);
  }
}

// Export the pool if raw access is needed
export default pool;