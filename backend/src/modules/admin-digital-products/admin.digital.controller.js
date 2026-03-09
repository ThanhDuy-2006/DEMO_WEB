import { connectDB } from "../../utils/db.js";
import { v4 as uuidv4 } from 'uuid';

export const getAllProducts = async (req, res) => {
    try {
        const pool = await connectDB();
        const [rows] = await pool.query("SELECT * FROM digital_products ORDER BY created_at DESC");
        const formatted = rows.map(p => ({
            ...p,
            features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
        }));
        res.json(formatted);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

export const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectDB();
        const [rows] = await pool.query("SELECT * FROM digital_products WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });
        
        const p = rows[0];
        p.features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
        res.json(p);
    } catch (e) {
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

export const createProduct = async (req, res) => {
    const { 
        name, category, duration, features, price, original_price, 
        badge_type, stock, is_active, image, account_details,
        allow_key_delivery, allow_direct_delivery
    } = req.body;

    // Basic validation
    if (!name || !price) return res.status(400).json({ error: "Tên và Giá là bắt buộc" });

    try {
        const pool = await connectDB();
        const [result] = await pool.execute(
            `INSERT INTO digital_products 
            (name, category, duration, features, price, original_price, badge_type, stock, is_active, image, account_details, allow_key_delivery, allow_direct_delivery) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, category || 'Other', duration || '1 tháng', 
                JSON.stringify(features || []), price, original_price || price, 
                badge_type || null, stock || -1, is_active ?? 1, image || null, account_details || null,
                allow_key_delivery ?? 1, allow_direct_delivery ?? 1
            ]
        );
        res.json({ success: true, id: result.insertId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi tạo sản phẩm" });
    }
};

export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { 
        name, category, duration, features, price, original_price, 
        badge_type, stock, is_active, image, account_details,
        allow_key_delivery, allow_direct_delivery
    } = req.body;

    try {
        const pool = await connectDB();
        await pool.execute(
            `UPDATE digital_products SET 
                name=?, category=?, duration=?, features=?, price=?, 
                original_price=?, badge_type=?, stock=?, is_active=?, image=?, account_details=?,
                allow_key_delivery=?, allow_direct_delivery=?
             WHERE id=?`,
            [
                name, category, duration, JSON.stringify(features), price, 
                original_price, badge_type, stock, is_active, image, account_details,
                allow_key_delivery ?? 1, allow_direct_delivery ?? 1,
                id
            ]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi cập nhật sản phẩm" });
    }
};

export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectDB();
        await pool.execute("DELETE FROM digital_products WHERE id = ?", [id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Lỗi xóa sản phẩm" });
    }
};
