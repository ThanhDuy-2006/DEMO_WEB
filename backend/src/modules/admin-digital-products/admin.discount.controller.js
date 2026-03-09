import { connectDB } from "../../utils/db.js";

export const getDiscounts = async (req, res) => {
    try {
        const pool = await connectDB();
        const [rows] = await pool.query("SELECT * FROM discount_codes ORDER BY created_at DESC");
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

export const createDiscount = async (req, res) => {
    const { code, type, value, min_order_value, max_discount, usage_limit, expiry_date, is_active } = req.body;
    if (!code || !type || !value) return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });

    try {
        const pool = await connectDB();
        await pool.execute(
            `INSERT INTO discount_codes 
            (code, type, value, min_order_value, max_discount, usage_limit, expiry_date, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [code.toUpperCase(), type, value, min_order_value || 0, max_discount || null, usage_limit || null, expiry_date || null, is_active ?? 1]
        );
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Mã giảm giá đã tồn tại" });
        console.error(e);
        res.status(500).json({ error: "Lỗi tạo mã giảm giá" });
    }
};

export const updateDiscount = async (req, res) => {
    const { id } = req.params;
    const { code, type, value, min_order_value, max_discount, usage_limit, expiry_date, is_active } = req.body;

    try {
        const pool = await connectDB();
        await pool.execute(
            `UPDATE discount_codes SET 
                code=?, type=?, value=?, min_order_value=?, max_discount=?, 
                usage_limit=?, expiry_date=?, is_active=?
             WHERE id=?`,
            [code.toUpperCase(), type, value, min_order_value, max_discount, usage_limit, expiry_date, is_active, id]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi cập nhật mã giảm giá" });
    }
};

export const deleteDiscount = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectDB();
        await pool.execute("DELETE FROM discount_codes WHERE id = ?", [id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Lỗi xóa mã giảm giá" });
    }
};
