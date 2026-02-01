import os

# The TypeScript code for the Smart Database Connection
db_content = """import mysql from 'mysql2/promise';

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
"""

# Define the target path (lib/db.ts)
target_dir = 'lib'
filename = 'db.ts'
file_path = os.path.join(target_dir, filename)

def create_file():
    # 1. Ensure lib folder exists
    if not os.path.exists(target_dir):
        try:
            os.makedirs(target_dir)
            print(f"📁 Created directory: {target_dir}")
        except OSError as e:
            print(f"❌ Error creating directory: {e}")
            return

    # 2. Write the file
    try:
        with open(file_path, 'w') as f:
            f.write(db_content)
        
        print("-" * 40)
        print(f"✅ SUCCESS! Database file created at:")
        print(f"   {os.path.abspath(file_path)}")
        print("-" * 40)
        print("👉 This file is now HYBRID: Works with Local MySQL & TiDB Cloud.")
        
    except Exception as e:
        print(f"❌ Failed to write file: {e}")

if __name__ == "__main__":
    create_file()