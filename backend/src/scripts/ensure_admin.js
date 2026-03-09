
import { connectDB } from "../utils/db.js";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load env just in case, though db.js probably does it.
dotenv.config();

const ensureAdmin = async () => {
    try {
        console.log("🚀 Checking Admin User...");
        const pool = await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPass = process.env.ADMIN_PASSWORD || '123456';
        
        console.log(`Checking admin email: ${adminEmail}`);

        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [adminEmail]);

        if (rows.length === 0) {
            console.log('Admin user not found. Creating...');
            const hashedPassword = await bcrypt.hash(adminPass, 10);
            
            // Check if user table exists (sanity check)
            // Assuming it does since migration ran.
            
            await pool.execute(`
                INSERT INTO users (email, password_hash, role, full_name, status) 
                VALUES (?, ?, 'admin', 'System Administrator', 'active')
            `, [adminEmail, hashedPassword]);
            
            console.log('✅ Admin user created successfully.');
        } else {
            const user = rows[0];
            if (user.role !== 'admin') {
                console.log('User exists but not admin. Updating role...');
                await pool.execute('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id]);
                console.log('✅ User updated to admin.');
            } else {
                console.log('✅ Admin user already exists and is configured correctly.');
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ensuring admin:', error);
        process.exit(1);
    }
};

ensureAdmin();
