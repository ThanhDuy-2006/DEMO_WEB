import { connectDB } from "../utils/db.js";
import logger from "../utils/logger.js";

async function upgradeDb() {
    console.log("🚀 Upgrading Database for SaaS Features...");

    const pool = await connectDB();

    try {
        // 1. Create VISIT_LOGS (for Heatmap)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS visit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                ip VARCHAR(45),
                user_agent TEXT,
                path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at),
                INDEX idx_user_id (user_id)
            )
        `);
        console.log("✅ Created visit_logs table");

        // 2. Create REPORTS (Moderation)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reporter_id INT NOT NULL,
                target_type ENUM('product', 'user', 'house') NOT NULL,
                target_id INT NOT NULL,
                reason TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_target (target_type, target_id),
                INDEX idx_status (status)
            )
        `);
        console.log("✅ Created reports table");

        // 3. Create VIOLATIONS (Auto-ban logic)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS violations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                report_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
                INDEX idx_user_violation (user_id, created_at)
            )
        `);
        console.log("✅ Created violations table");

        // 4. Create ADMIN_LOGS (Audit)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                target_type VARCHAR(50),
                target_id INT,
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_admin_action (admin_id, created_at)
            )
        `);
        console.log("✅ Created admin_logs table");

        console.log("✅ Database Upgrade Complete!");
    } catch (err) {
        console.error("❌ Database Upgrade Failed:", err);
    } finally {
        process.exit();
    }
}

upgradeDb();
