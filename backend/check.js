import { connectDB } from "./src/utils/db.js";
import fs from "fs";

async function check() {
    const pool = await connectDB();
    try {
        const [w] = await pool.query("SELECT id, user_id, amount, created_at, type FROM wallet_transactions ORDER BY id DESC LIMIT 5");
        const [f] = await pool.query("SELECT id, amount, type, source_type, source_id, transaction_date FROM financial_records WHERE source_type='WALLET' ORDER BY id DESC LIMIT 5");
        fs.writeFileSync("db_dump.json", JSON.stringify({ w, f }, null, 2));
    } catch(e) { console.error(e); }
    process.exit(0);
}
check();
