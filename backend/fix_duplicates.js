
import { connectDB } from "./src/utils/db.js";

async function fix() {
    try {
        const pool = await connectDB();
        
        // Find duplicates
        const [rows] = await pool.execute(`
            SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
            FROM products 
            WHERE house_id = 1 AND status = 'active'
            GROUP BY name
            HAVING count > 1
        `);
        
        console.log("Found duplicates:", rows.length);
        
        for (const row of rows) {
            const ids = row.ids.split(',').map(Number);
            // We want to keep the one with quantity > 0 if possible, or the oldest one
            const [products] = await pool.execute(`SELECT id, quantity FROM products WHERE id IN (${ids.join(',')}) ORDER BY quantity DESC, created_at ASC`);
            
            const toKeep = products[0].id;
            const toDelete = ids.filter(id => id !== toKeep);
            
            console.log(`Keeping ${toKeep} for ${row.name}, deleting ${toDelete.join(', ')}`);
            
            if (toDelete.length > 0) {
                await pool.execute(`UPDATE products SET status = 'deleted', deleted_at = NOW() WHERE id IN (${toDelete.join(',')})`);
                await pool.execute(`UPDATE user_inventories SET deleted_at = NOW() WHERE product_id IN (${toDelete.join(',')})`);
            }
        }
        
        console.log("Cleanup complete");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fix();
