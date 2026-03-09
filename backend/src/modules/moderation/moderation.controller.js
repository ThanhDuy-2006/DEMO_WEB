import { connectDB } from "../../utils/db.js";
import logger from "../../utils/logger.js";

// Rate limiting map (simple in-memory for MVP, ideally Redis)
const reportRateLimit = new Map();

// Helper to check rate limit 5/hour
const checkRateLimit = (userId) => {
    const now = Date.now();
    const window = 3600000; // 1 hour
    const userLimit = reportRateLimit.get(userId) || [];
    
    // Filter out old timestamps
    const active = userLimit.filter(ts => now - ts < window);
    
    if (active.length >= 5) return false;
    
    active.push(now);
    reportRateLimit.set(userId, active);
    return true;
};

// 1. Create Report
export const createReport = async (req, res) => {
    const { target_type, target_id, reason } = req.body;
    const reporter_id = req.user.id;

    if (!["product", "user", "house"].includes(target_type)) {
        return res.status(400).json({ error: "Invalid target type" });
    }

    // Rate Limit
    if (!checkRateLimit(reporter_id)) {
        return res.status(429).json({ error: "Too many reports. Try again in an hour." });
    }

    try {
        const pool = await connectDB();
        
        // Prevent self-report
        if (target_type === 'user' && parseInt(target_id) === reporter_id) {
             return res.status(400).json({ error: "Cannot report yourself" });
        }
        
        // Ideally check if target exists, but skipping for speed unless critical

        await pool.execute(`
            INSERT INTO reports (reporter_id, target_type, target_id, reason)
            VALUES (?, ?, ?, ?)
        `, [reporter_id, target_type, target_id, reason]);

        res.status(201).json({ message: "Report submitted successfully" });
    } catch (err) {
        logger.error("Create Report Error", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 2. Get Reports (Admin)
export const getReports = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;
        
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        console.log(`[DEBUG] getReports params: status=${status} page=${pageNum} limit=${limitNum} offset=${offset}`);

        const pool = await connectDB();
        
        // Use pool.query instead of execute to avoid LIMIT ? issues with prepared statements in some drivers
        const [rows] = await pool.query(`
            SELECT r.*, u.full_name as reporter_name 
            FROM reports r
            LEFT JOIN users u ON r.reporter_id = u.id
            WHERE r.status = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `, [status, limitNum, offset]);

        console.log(`[DEBUG] Found ${rows.length} rows for status ${status}`);


        const [countRow] = await pool.query(`
            SELECT COUNT(*) as total FROM reports WHERE status = ?
        `, [status]);

        res.json({
            data: rows,
            pagination: {
                total: countRow[0].total,
                page: parseInt(page),
                limit: limitNum
            }
        });
    } catch (err) {
        // Log the full error object
        console.error("Get Reports Error Details:", {
            message: err.message,
            code: err.code,
            sql: err.sql,
            stack: err.stack
        });
        
        // Return actual error message to frontend (for debugging SaaS)
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: err.message 
        });
    }
};

// 3. Resolve Report (Admin)
export const resolveReport = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'approve' | 'reject'
    const admin_id = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
         return res.status(400).json({ error: "Invalid action" });
    }

    const connection = await (await connectDB()).getConnection();
    try {
        await connection.beginTransaction();

        // Get report details
        const [reports] = await connection.execute("SELECT * FROM reports WHERE id = ?", [id]);
        if (reports.length === 0) {
             await connection.rollback();
             return res.status(404).json({ error: "Report not found" });
        }
        const report = reports[0];

        if (report.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ error: "Report already resolved" });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        
        // Update report status
        await connection.execute(`
            UPDATE reports SET status = ?, resolved_at = NOW() WHERE id = ?
        `, [newStatus, id]);

        // Log Admin Action
        await connection.execute(`
            INSERT INTO admin_logs (admin_id, action, target_type, target_id, metadata)
            VALUES (?, ?, ?, ?, ?)
        `, [admin_id, `report_${action}`, report.target_type, report.target_id, JSON.stringify({ reason: report.reason })]);

        // If Approved -> Take Action (Ban/Hide) & Record Violation
        if (action === 'approve') {
             let offender_id = null;

             if (report.target_type === 'user') {
                 offender_id = report.target_id;
                 await connection.execute("UPDATE users SET status = 'banned' WHERE id = ?", [offender_id]);
             } else if (report.target_type === 'product') {
                 // Find owner of product
                 const [prods] = await connection.execute("SELECT seller_id FROM products WHERE id = ?", [report.target_id]);
                 if (prods.length > 0) offender_id = prods[0].seller_id;
                 
                 await connection.execute("UPDATE products SET status = 'rejected' WHERE id = ?", [report.target_id]);
             } else if (report.target_type === 'house') {
                 // Find owner
                 const [houses] = await connection.execute("SELECT owner_id FROM houses WHERE id = ?", [report.target_id]);
                 if (houses.length > 0) offender_id = houses[0].owner_id;
                 
                 await connection.execute("UPDATE houses SET status = 'inactive' WHERE id = ?", [report.target_id]);
             }

             if (offender_id) {
                 // Record Violation
                 await connection.execute(`
                    INSERT INTO violations (user_id, type, report_id)
                    VALUES (?, ?, ?)
                 `, [offender_id, report.target_type, id]);

                 // Check for Auto-Ban ( >3 violations in 7 days )
                 const [vCount] = await connection.execute(`
                    SELECT COUNT(*) as count FROM violations 
                    WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                 `, [offender_id]);

                 if (vCount[0].count > 3) {
                     // Auto-ban user
                     await connection.execute("UPDATE users SET status = 'banned' WHERE id = ?", [offender_id]);
                     // Log auto-ban
                      await connection.execute(`
                        INSERT INTO admin_logs (admin_id, action, target_type, target_id, metadata)
                        VALUES (?, 'auto_ban_user', 'user', ?, ?)
                    `, [admin_id, offender_id, JSON.stringify({ reason: "Exceeded violation limit" })]);
                 }
             }
        }

        await connection.commit();
        res.json({ message: `Report ${newStatus}` });
    } catch (err) {
        await connection.rollback();
        logger.error("Resolve Report Error", err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        connection.release();
    }
};

export default {
    createReport,
    getReports,
    resolveReport
};
