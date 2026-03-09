import { connectDB } from "../utils/db.js";

// Simple in-memory cache to debounce initial parallel requests (e.g., 10 seconds)
const recentVisitsData = new Set();

export const logVisits = async (req, res, next) => {
    try {
        const path = req.originalUrl;
        
        // Skip health checks and static paths
        if (path.startsWith('/api/health') || path.startsWith('/uploads')) return next();

        // 1. If user hasn't started a visit session, or session expired/cleared
        if (!req.cookies.visit_session) {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            const userId = req.user ? req.user.id : null;
            
            const debounceKey = `${ip}-${userAgent}-${userId}`;
            
            // 2. Debounce to prevent multiple hits at the exact same time
            if (!recentVisitsData.has(debounceKey)) {
                recentVisitsData.add(debounceKey);
                setTimeout(() => recentVisitsData.delete(debounceKey), 10000); 
                
                const pool = await connectDB();
                pool.execute(`
                    INSERT INTO visit_logs (user_id, ip, user_agent, path)
                    VALUES (?, ?, ?, ?)
                `, [userId, ip, userAgent, path]).catch(() => {});
            }

            // 3. Mark the visit session (cookie expires when browser closes)
            res.cookie('visit_session', '1', {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                path: '/'
            });
        }
    } catch (err) {
        // Ignore errors so app keeps running
    }
    next();
};
