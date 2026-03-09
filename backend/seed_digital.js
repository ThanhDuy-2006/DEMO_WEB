import { connectDB } from "./src/utils/db.js";

async function run() {
    const pool = await connectDB();
    try {
        console.log("🚀 Initializing Digital Marketplace tables...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS digital_products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                duration VARCHAR(50) NOT NULL,
                features JSON NOT NULL,
                price DECIMAL(15, 2) NOT NULL,
                original_price DECIMAL(15, 2) NOT NULL,
                badge_type ENUM('NEW', 'BEST SELLER', 'ADD-ON') DEFAULT NULL,
                is_active TINYINT(1) DEFAULT 1,
                stock INT DEFAULT -1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (category),
                INDEX (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS digital_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                price DECIMAL(15, 2) NOT NULL,
                status ENUM('pending', 'paid', 'activated', 'cancelled') DEFAULT 'pending',
                activation_code VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE CASCADE,
                INDEX (user_id),
                INDEX (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Check if data exists
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM digital_products");
        if (rows[0].count === 0) {
            console.log("🌱 Seeding sample digital products...");
            const products = [
                ['CapCut Pro', 'Design & Video', '1 tháng', JSON.stringify(["Chỉnh sửa video chuyên nghiệp", "Xuất video 4K không watermark", "Truy cập kho template Premium", "Hiệu ứng & bộ lọc Pro"]), 35000, 99000, 'NEW'],
                ['ChatGPT Plus', 'AI Chat', '1 tháng', JSON.stringify(["Truy cập GPT-4/GPT-o mới nhất", "Codex 5.3 hỗ trợ lập trình", "DALL-E 3 tạo ảnh AI", "Browsing & Plugins"]), 36000, 550000, 'BEST SELLER'],
                ['Gemini AI Pro', 'Gemini', '1 năm', JSON.stringify(["Gói Gemini AI Pro — Cả Family", "Phân tích, viết nội dung, học tập", "Hỗ trợ Gemini Canvas", "Guided Learning", "Add được 5 slot thành viên"]), 165000, 500000, 'ADD-ON']
            ];
            await pool.query(
                "INSERT INTO digital_products (name, category, duration, features, price, original_price, badge_type) VALUES ?",
                [products]
            );
        }

        console.log("✅ Done!");
    } catch(e) {
        console.error("❌ Migration failed:", e);
    }
    process.exit(0);
}

run();
