
import { connectDB } from "../utils/db.js";

const debugReports = async () => {
    try {
        console.log("🚀 Debugging Reports Table...");
        const pool = await connectDB();

        // 1. Check total count
        const [total] = await pool.query("SELECT COUNT(*) as count FROM reports");
        console.log(`Total Reports in DB: ${total[0].count}`);

        // 2. Breakdown by Status
        const [counts] = await pool.query("SELECT status, COUNT(*) as count FROM reports GROUP BY status");
        console.log("Breakdown by Status:");
        console.table(counts);

        // 3. List actual rows (limit 10)
        const [rows] = await pool.query("SELECT id, reporter_id, target_type, target_id, status, created_at FROM reports ORDER BY id DESC LIMIT 10");
        console.log("Recent 10 Reports:");
        console.table(rows);

        process.exit();
    } catch (err) {
        console.error("Debug Error:", err);
        process.exit(1);
    }
};

debugReports();
