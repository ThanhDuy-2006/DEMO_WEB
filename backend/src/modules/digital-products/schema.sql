/*
 * DATABASE SCHEMA FOR DIGITAL MARKETPLACE (MySQL)
 */

/* 1. Products Table */
CREATE TABLE IF NOT EXISTS digital_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL, -- e.g. 1 tháng, 1 năm
    features JSON NOT NULL, -- Store array of strings
    price DECIMAL(15, 2) NOT NULL,
    original_price DECIMAL(15, 2) NOT NULL,
    badge_type ENUM('NEW', 'BEST SELLER', 'ADD-ON') DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    stock INT DEFAULT -1, -- -1 for unlimited
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (category),
    INDEX (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* 2. Orders & Activations Table */
CREATE TABLE IF NOT EXISTS digital_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    status ENUM('pending', 'paid', 'activated', 'cancelled') DEFAULT 'pending',
    activation_code VARCHAR(100), -- The key to activate service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* 3. Sample Data Insert */
INSERT INTO digital_products (name, category, duration, features, price, original_price, badge_type)
VALUES (
    'CapCut Pro', 
    'Design & Video', 
    '1 tháng', 
    '["Chỉnh sửa video chuyên nghiệp", "Xuất video 4K không watermark", "Truy cập kho template Premium", "Hiệu ứng & bộ lọc Pro"]', 
    35000, 
    99000, 
    'NEW'
),
(
    'ChatGPT Plus', 
    'AI Chat', 
    '1 tháng', 
    '["Truy cập GPT-4/GPT-o mới nhất", "Codex 5.3 hỗ trợ lập trình", "DALL-E 3 tạo ảnh AI", "Browsing & Plugins"]', 
    36000, 
    550000, 
    'BEST SELLER'
);

/* 4. Discount Codes Table */
CREATE TABLE IF NOT EXISTS discount_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('percentage', 'fixed') NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    min_order_value DECIMAL(15, 2) DEFAULT 0,
    max_discount DECIMAL(15, 2) DEFAULT NULL,
    usage_limit INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    expiry_date DATETIME DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (code),
    INDEX (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
