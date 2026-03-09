
import { connectDB } from "./src/utils/db.js";
import fs from "fs";

async function check() {
    try {
        const pool = await connectDB();
        const [products] = await pool.execute("SELECT * FROM products WHERE house_id = 1 AND status = 'active'");
        fs.writeFileSync("active_products.json", JSON.stringify(products, null, 2));
        console.log("Written active_products.json");
        
        const [members] = await pool.execute(`
            SELECT u.id, u.full_name 
            FROM user_houses uh 
            JOIN users u ON u.id = uh.user_id 
            WHERE uh.house_id = 1
        `);
        fs.writeFileSync("house_members.json", JSON.stringify(members, null, 2));
        console.log("Written house_members.json");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
