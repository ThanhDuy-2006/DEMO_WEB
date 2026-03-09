import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z' // Force UTC
};

let pool;

export async function connectDB() {
  if (!pool) {
    try {
      pool = mysql.createPool(config);
      // Test connection
      const connection = await pool.getConnection();
      console.log('✅ MySQL Connected successfully');
      
      // Auto Migration & Cleanup
      try {
          await connection.query('ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      } catch(e) { /* Ignore if exists */ }

      try {
          await connection.query(`
              CREATE TABLE IF NOT EXISTS user_follow_comics (
                  id int NOT NULL AUTO_INCREMENT,
                  user_id int NOT NULL,
                  comic_slug varchar(255) NOT NULL,
                  comic_name varchar(255) NOT NULL,
                  comic_thumb varchar(500) DEFAULT NULL,
                  last_chapter varchar(50) DEFAULT NULL,
                  notify_enabled tinyint(1) DEFAULT '1',
                  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  UNIQUE KEY unique_follow (user_id, comic_slug),
                  CONSTRAINT user_follow_comics_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
          `);
      } catch(e) { /* Ignore if exists */ }

      const runCleanup = async () => {
          try {
              const [delRows] = await pool.query('DELETE FROM products WHERE quantity <= 0 AND updated_at < NOW() - INTERVAL 1 DAY');
              if (delRows && delRows.affectedRows > 0) {
                  console.log(`🧹 Đã dọn dẹp ${delRows.affectedRows} sản phẩm hết hàng quá 1 ngày.`);
              }
          } catch(e) {}
      };

      runCleanup();
      setInterval(runCleanup, 60 * 60 * 1000); // Check every 1 hour

      connection.release();
    } catch (err) {
      console.error('❌ MySQL Connection Failed!', err);
      throw err;
    }
  }
  return pool;
}

export { pool };
