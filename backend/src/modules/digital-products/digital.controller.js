import { connectDB } from "../../utils/db.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Digital Products Marketplace Controller
 */
export const getProducts = async (req, res) => {
    const { category, search } = req.query;
    try {
        const pool = await connectDB();
        let query = "SELECT * FROM digital_products WHERE is_active = 1";
        const params = [];

        if (category) {
            query += " AND category = ?";
            params.push(category);
        }

        if (search) {
            query += " AND name LIKE ?";
            params.push(`%${search}%`);
        }

        query += " ORDER BY created_at DESC";
        const [rows] = await pool.execute(query, params);
        
        // Parse JSON features back to array if stored as string
        const formatted = rows.map(p => ({
            ...p,
            features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
        }));

        res.json(formatted);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi tải sản phẩm" });
    }
};

export const validateDiscountCode = async (req, res) => {
    const { code, productId } = req.body;
    if (!code) return res.status(400).json({ error: "Thiếu mã giảm giá" });

    try {
        const pool = await connectDB();
        
        // 1. Get Product Price
        const [pRows] = await pool.execute("SELECT price FROM digital_products WHERE id = ?", [productId]);
        if (!pRows[0]) return res.status(404).json({ error: "Sản phẩm không tồn tại" });
        const productPrice = Number(pRows[0].price);

        // 2. Get Discount Details
        const [dRows] = await pool.execute(
            "SELECT * FROM discount_codes WHERE code = ? AND is_active = 1", 
            [code.toUpperCase()]
        );
        
        if (!dRows[0]) return res.status(400).json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" });
        const discount = dRows[0];

        // 3. Validation Logic
        const now = new Date();
        if (discount.expiry_date && new Date(discount.expiry_date) < now) {
            return res.status(400).json({ error: "Mã giảm giá đã hết hạn sử dụng" });
        }

        if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
            return res.status(400).json({ error: "Mã giảm giá đã hết lượt sử dụng" });
        }

        if (productPrice < Number(discount.min_order_value)) {
            return res.status(400).json({ error: `Cần đơn hàng tối thiểu ${Number(discount.min_order_value).toLocaleString()}đ để dùng mã này` });
        }

        // 4. Calculate Discount Amount
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = (productPrice * Number(discount.value)) / 100;
            if (discount.max_discount && discountAmount > Number(discount.max_discount)) {
                discountAmount = Number(discount.max_discount);
            }
        } else {
            discountAmount = Number(discount.value);
        }

        res.json({
            success: true,
            discountAmount,
            finalPrice: Math.max(0, productPrice - discountAmount),
            code: discount.code
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi kiểm tra mã giảm giá" });
    }
};

export const getProductDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectDB();
        // Securely exclude account_details from public view
        const [rows] = await pool.execute(
            "SELECT id, name, category, duration, features, price, original_price, badge_type, stock, is_active, image, allow_key_delivery, allow_direct_delivery FROM digital_products WHERE id = ? AND is_active = 1", 
            [id]
        );
        
        if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

        const p = rows[0];
        p.features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;

        res.json(p);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
};

export const checkout = async (req, res) => {
    const { productId, discountCode } = req.body;
    const userId = req.user.id;

    if (!productId) return res.status(400).json({ error: "Thiếu mã sản phẩm" });

    let connection;
    try {
        const pool = await connectDB();
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Get Product Detail (Include account_details for the buyer)
        const [pRows] = await connection.execute(
            "SELECT * FROM digital_products WHERE id = ? FOR UPDATE", 
            [productId]
        );
        if (!pRows[0]) throw new Error("Sản phẩm không tồn tại");
        const product = pRows[0];

        // 1b. Check Stock
        if (product.stock !== -1 && product.stock <= 0) {
            throw new Error(`Sản phẩm ${product.name} đã hết hàng.`);
        }

        let basePrice = Number(product.price);
        let finalPrice = basePrice;
        let discountId = null;

        // 1c. Handle Discount Code if exists
        if (discountCode) {
            const [dRows] = await connection.execute(
                "SELECT * FROM discount_codes WHERE code = ? AND is_active = 1 FOR UPDATE",
                [discountCode.toUpperCase()]
            );
            if (dRows[0]) {
                const discount = dRows[0];
                const now = new Date();
                const isValid = (!discount.expiry_date || new Date(discount.expiry_date) > now) &&
                                (!discount.usage_limit || discount.used_count < discount.usage_limit) &&
                                (basePrice >= Number(discount.min_order_value));
                
                if (isValid) {
                    let discountAmount = 0;
                    if (discount.type === 'percentage') {
                        discountAmount = (basePrice * Number(discount.value)) / 100;
                        if (discount.max_discount && discountAmount > Number(discount.max_discount)) {
                            discountAmount = Number(discount.max_discount);
                        }
                    } else {
                        discountAmount = Number(discount.value);
                    }
                    finalPrice = Math.max(0, basePrice - discountAmount);
                    discountId = discount.id;
                    
                    // Increment used_count
                    await connection.execute("UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?", [discountId]);
                }
            }
        }

        const requiredPrice = finalPrice;

        // 2. Create Order
        const [oRes] = await connection.execute(
            "INSERT INTO digital_orders (user_id, product_id, price, status) VALUES (?, ?, ?, 'pending')",
            [userId, productId, requiredPrice]
        );
        const orderId = oRes.insertId;

        // 3. Subtract Wallet Balance
        let [wRows] = await connection.execute("SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE", [userId]);
        
        // Auto-create wallet if not exists
        if (!wRows[0]) {
            await connection.execute("INSERT INTO wallets (user_id, balance) VALUES (?, 0)", [userId]);
            wRows = [{ balance: 0 }];
        }

        const currentBalance = Number(wRows[0].balance);

        console.log(`[Checkout Debug] User: ${userId}, Balance: ${currentBalance}, Price: ${requiredPrice} (Base: ${basePrice})`);

        if (currentBalance < requiredPrice) {
            throw new Error(`Số dư trong ví không đủ. Bạn cần ${requiredPrice.toLocaleString()}đ, hiện có ${currentBalance.toLocaleString()}đ. Vui lòng nạp thêm tiền.`);
        }

        // Deduct Balance
        await connection.execute("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [requiredPrice, userId]);

        // Record Transaction in Wallet History
        await connection.execute(
            `INSERT INTO wallet_transactions (user_id, type, amount, description) 
             VALUES (?, 'PURCHASE', ?, ?)`,
            [userId, -requiredPrice, `Mua sản phẩm số: ${product.name}`]
        );

        // 4. Handle Account Delivery and Stock Deduction
        let revealedAccount = "Vui lòng liên hệ Admin để nhận thông tin.";
        let remainingAccountsStr = product.account_details || "";
        
        if (remainingAccountsStr.trim()) {
            // Split by any newline character and filter out empty lines
            const accounts = remainingAccountsStr.split(/\r?\n/).filter(line => line.trim() !== "");
            
            if (accounts.length > 0) {
                revealedAccount = accounts[0]; // Take the first account
                const remainingAccounts = accounts.slice(1); // Remove the first one
                remainingAccountsStr = remainingAccounts.join("\n");
                
                // Update product: decrease stock and update remaining accounts
                // If it was the last account and stock wasn't unlimited, stock becomes 0
                const newStock = product.stock !== -1 ? Math.max(0, product.stock - 1) : -1;
                
                await connection.execute(
                    "UPDATE digital_products SET account_details = ?, stock = ? WHERE id = ?",
                    [remainingAccountsStr, newStock, productId]
                );
            } else {
                // If stock was reported > 0 but no lines found
                if (product.stock !== -1) {
                    await connection.execute("UPDATE digital_products SET stock = 0 WHERE id = ?", [productId]);
                }
                throw new Error("Sản phẩm hiện đang hết hàng (Kho trống).");
            }
        } else {
            // No account details at all
            if (product.stock !== -1 && product.stock > 0) {
                await connection.execute("UPDATE digital_products SET stock = 0 WHERE id = ?", [productId]);
            }
            throw new Error("Sản phẩm này chưa được cấu hình tài khoản bàn giao.");
        }

        // 5. Generate Activation Code (UUID - kept for DB integrity though hidden in UI)
        const activationCode = uuidv4().split('-')[0].toUpperCase();

        // 6. Update Order Status
        await connection.execute(
            "UPDATE digital_orders SET status = 'activated', activation_code = ?, account_details = ? WHERE id = ?",
            [activationCode, revealedAccount, orderId]
        );

        await connection.commit();
        res.json({ 
            success: true, 
            orderId, 
            activationCode,
            account_details: revealedAccount,
            message: `Kích hoạt thành công ${product.name}!` 
        });

    } catch (e) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: e.message || "Lỗi giao dịch" });
    } finally {
        if (connection) connection.release();
    }
};
