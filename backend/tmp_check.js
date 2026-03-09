
import { connectDB } from "./src/utils/db.js";

async function check() {
    try {
        const pool = await connectDB();
        const [products] = await pool.execute("SELECT * FROM products WHERE house_id = 1");
        console.log("Products for house 1:", JSON.stringify(products, null, 2));
        
        const [houses] = await pool.execute("SELECT * FROM houses WHERE id = 1");
        console.log("House 1:", JSON.stringify(houses, null, 2));

        const [memberships] = await pool.execute("SELECT * FROM user_houses WHERE house_id = 1");
        console.log("Memberships for house 1:", JSON.stringify(memberships, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
