import mysql from 'mysql2/promise';

let pool: mysql.Pool;

export const db = {
  getConnection: async () => {
    if (!pool) {
      // Check if we are running locally to decide on SSL
      const isLocal = process.env.DB_HOST === '127.0.0.1' || process.env.DB_HOST === 'localhost';

      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        // SMART SSL: Disable for Local, Enable Strict for Cloud (TiDB)
        ssl: isLocal ? undefined : {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    }
    return pool;
  }
};

export async function query({ query, values = [] }: { query: string; values?: any[] }) {
  const pool = await db.getConnection();
  const [results] = await pool.execute(query, values);
  return results;
}
