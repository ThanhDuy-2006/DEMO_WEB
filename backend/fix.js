import { connectDB } from "./src/utils/db.js";

async function run() {
    const pool = await connectDB();
    try {
        await pool.query("ALTER TABLE financial_records MODIFY COLUMN source_type ENUM('MANUAL', 'WALLET', 'ORDER', 'HOUSE_TX') DEFAULT 'MANUAL'");
        await pool.query("UPDATE financial_records SET source_type = 'HOUSE_TX' WHERE source_type = '' OR source_type IS NULL");
        console.log("Done fixing schema and updating old rows");
    } catch(e) {
        console.log(e);
    }
    process.exit(0);
}

run();
