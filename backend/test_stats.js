import { connectDB } from "./src/utils/db.js";

async function check() {
    const pool = await connectDB();
    const [totals] = await pool.execute(`
        SELECT type, SUM(amount) as total 
        FROM financial_records 
        WHERE user_id = 1 AND transaction_date BETWEEN '2026-02-01 00:00:00' AND '2026-02-28 23:59:59' AND deleted_at IS NULL
        GROUP BY type
    `);
    console.log("Stats totals:", totals);
    process.exit(0);
}
check();
