import { connectDB } from "../../utils/db.js";
import { redisCache } from "../../utils/redis.js";
import logger from "../../utils/logger.js";

// Helper for caching
const cache = async (key, duration, dbFn) => {
    return redisCache(key, duration, dbFn);
};

// A. Traffic Heatmap (0-23h)
const getTrafficHeatmap = async (req, res) => {
    try {
        const pool = await connectDB();
        const cacheKey = "admin:analytics:heatmap";
        
        const data = await cache(cacheKey, 300, async () => {
            // Aggregate visits by hour over last 30 days
            const [rows] = await pool.execute(`
                SELECT HOUR(created_at) as hour, COUNT(*) as count 
                FROM visit_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY hour
            `);
            
            // Fill 0-23
            const hours = Array(24).fill(0);
            rows.forEach(r => {
                if(r.hour >= 0 && r.hour <= 23) hours[r.hour] = r.count;
            });
            return hours;
        });

        res.json({ heatmap: data });
    } catch (error) {
        logger.error("Error getting traffic heatmap:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// B. Revenue By Day
const getRevenueByDay = async (req, res) => {
    try {
        const { range = 7 } = req.query; // 7, 30, 90
        const days = parseInt(range);
        
        const pool = await connectDB();
        const cacheKey = `admin:analytics:revenue:${days}`;

        const data = await cache(cacheKey, 300, async () => {
            const [rows] = await pool.execute(`
                SELECT DATE(created_at) as date, SUM(total_amount) as revenue
                FROM orders
                WHERE status = 'completed' 
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY date
                ORDER BY date ASC
            `, [days]);
            return rows;
        });

        res.json({ revenue: data });
    } catch (error) {
        logger.error("Error getting revenue:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// C. Hourly Transactions (Realtime Line Chart)
const getHourlyTransactions = async (req, res) => {
    try {
        const pool = await connectDB();
        const cacheKey = "admin:analytics:hourly_tx";

        // Lower cache time for "realtime" feel
        const data = await cache(cacheKey, 60, async () => {
            // Get data for today
            const [rows] = await pool.execute(`
                SELECT HOUR(created_at) as hour, COUNT(*) as count
                FROM orders
                WHERE status = 'completed' AND DATE(created_at) = CURDATE()
                GROUP BY hour
            `);
            
             // Fill 0-23
            const hours = Array(24).fill(0);
            rows.forEach(r => {
                if(r.hour >= 0 && r.hour <= 23) hours[r.hour] = r.count;
            });
            return hours;
        });

        res.json({ transactions: data });
    } catch (error) {
        logger.error("Error getting hourly transactions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// D. Conversion Rate (Daily)
const getConversionRate = async (req, res) => {
    try {
        const pool = await connectDB();
        const cacheKey = "admin:analytics:conversion";

        const data = await cache(cacheKey, 300, async () => {
            // Get visits today
            const [visitRows] = await pool.execute(`
                SELECT COUNT(*) as count FROM visit_logs WHERE DATE(created_at) = CURDATE()
            `);
            const visits = visitRows[0].count || 1; // avoid div by 0

             // Get orders today
            const [orderRows] = await pool.execute(`
                SELECT COUNT(*) as count FROM orders WHERE status='completed' AND DATE(created_at) = CURDATE()
            `);
            const orders = orderRows[0].count || 0;

            const rate = (orders / visits) * 100;
            return {
                rate: parseFloat(rate.toFixed(2)),
                visits,
                orders
            };
        });

        res.json(data);
    } catch (error) {
        logger.error("Error getting conversion rate:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// E. Top Products
const getTopProducts = async (req, res) => {
    try {
        const pool = await connectDB();
        const cacheKey = "admin:analytics:top_products";

        const data = await cache(cacheKey, 600, async () => {
            const [rows] = await pool.execute(`
                SELECT 
                    p.id, p.name, 
                    SUM(oi.quantity) as total_sold,
                    SUM(oi.price * oi.quantity) as total_revenue
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                WHERE o.status = 'completed'
                GROUP BY p.id, p.name
                ORDER BY total_sold DESC
                LIMIT 10
            `);
            return rows;
        });

        res.json({ topProducts: data });
    } catch (error) {
        logger.error("Error getting top products:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// F. Top House Activity
const getTopHouses = async (req, res) => {
    try {
        const pool = await connectDB();
        const cacheKey = "admin:analytics:top_houses";

        const data = await cache(cacheKey, 600, async () => {
             // 1. Transaction count per house
             // 2. Message count per house (need join conversations)
             // 3. Active members (count user_houses)
             // Complex query or multiple queries
             
             // Simplified Single Query approach using subselects or joins might be heavy.
             // We can do it in parts or one big query with specific logic.
             // Given requirement: Score = tx*3 + msg*1 + members*2.
             
             const [rows] = await pool.execute(`
                SELECT 
                    h.id, h.name,
                    (SELECT COUNT(*) FROM orders WHERE house_id = h.id AND status='completed') as tx_count,
                    (SELECT COUNT(*) 
                     FROM messages m 
                     JOIN conversations c ON m.conversation_id = c.id 
                     WHERE c.house_id = h.id) as msg_count,
                    (SELECT COUNT(*) FROM user_houses WHERE house_id = h.id) as member_count
                FROM houses h
                WHERE h.status = 'active'
             `);

             const scored = rows.map(h => ({
                 ...h,
                 score: (h.tx_count * 3) + (h.msg_count * 1) + (h.member_count * 2)
             }));

             scored.sort((a,b) => b.score - a.score);
             return scored.slice(0, 10);
        });

        res.json({ topHouses: data });
    } catch (error) {
         logger.error("Error getting top houses:", error);
         res.status(500).json({ error: "Internal Server Error" });
    }
}

// Routes Handler export
export default {
    getTrafficHeatmap,
    getRevenueByDay,
    getHourlyTransactions,
    getConversionRate,
    getTopProducts,
    getTopHouses
};
