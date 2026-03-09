import "./utils/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { initSocket } from "./utils/socket.js";
import jwt from "jsonwebtoken";
import passport from "./config/passport.js";
import compression from "compression";
import responseTime from "response-time";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import logger from "./core/logger.js"; // USING NEW WINSTON LOGGER
import cron from "node-cron";
import { runBackup } from "./scripts/backup_db.js";

// Route imports
import authRoutes from "./modules/auth/auth.routes.js";
import houseRoutes from "./modules/houses/houses.routes.js";
import productRoutes from "./modules/products/products.routes.js";
import stockRoutes from "./modules/stock-requests/stock.routes.js";
import inventoryRoutes from "./modules/user-inventories/inventory.routes.js";
import walletRoutes from "./modules/wallets/wallets.routes.js";
import cartRoutes from "./modules/carts/carts.routes.js";
import orderRoutes from "./modules/orders/orders.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";
import messageRoutes from "./modules/messages/messages.routes.js";
import expensesRoutes from "./modules/expenses/expenses.routes.js";
import entertainmentRoutes from "./modules/entertainment/entertainment.routes.js";
import followRoutes from "./modules/follow/follow.routes.js";
import excelRoutes from "./modules/houses-excel/excel.routes.js";
import activityRoutes from "./modules/user-activity/activity.routes.js";
import depositRoutes from "./modules/deposits/deposits.routes.js";
import digitalRoutes from "./modules/digital-products/digital.routes.js";
import adminDigitalRoutes from "./modules/admin-digital-products/admin.digital.routes.js";

import analyticsRoutes from "./modules/adminAnalytics/adminAnalytics.routes.js";
import moderationRoutes from "./modules/moderation/moderation.routes.js";
import tvRoutes from "./modules/tv/tv.routes.js";
import adminToolsRoutes from "./modules/admin-tools/admin-tools.routes.js";
import vocabularyRoutes from "./modules/vocabulary/vocabulary.routes.js";
import { connectDB } from "./utils/db.js";
import { startTrashCleanupScheduler } from "./modules/products/products.scheduler.js";
import { startActivityScheduler } from "./modules/user-activity/activity.scheduler.js";
import { initDb } from "./scripts/init_db_schema.js";
import { signAccessToken, signRefreshToken } from "./utils/token.js";
import { getFingerprint } from "./utils/fingerprint.js";
import { initRedis } from "./utils/redis.js";

// Global Middlewares & Error Classes
import globalErrorHandler from "./core/middlewares/errorHandler.js";
import { AppError } from "./core/errors.js";

// Middlewares
import { extractUser } from "./middlewares/authMiddleware.js";
import { trackUserActivity } from "./middlewares/activityMiddleware.js";
import { logVisits } from "./middlewares/logVisits.js";

startTrashCleanupScheduler();
startActivityScheduler();

// MONITORING: Memory Usage (Every 5 minutes)
setInterval(() => {
    const used = process.memoryUsage();
    logger.info(`[Monitoring] Memory: RSS=${(used.rss / 1024 / 1024).toFixed(2)}MB, HeapTotal=${(used.heapTotal / 1024 / 1024).toFixed(2)}MB, HeapUsed=${(used.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    if (used.heapUsed > 500 * 1024 * 1024) {
        logger.warn("CRITICAL: Memory usage is dangerously high (>500MB)");
    }
}, 5 * 60 * 1000);

// MONITORING: Event Loop Lag
let lastCheck = Date.now();
setInterval(() => {
    const now = Date.now();
    const lag = now - lastCheck - 1000;
    if (lag > 200) {
        logger.warn(`[Monitoring] Event Loop Lag detected: ${lag}ms`);
    }
    lastCheck = now;
}, 1000);

// DATABASE BACKUP: Daily at midnight
cron.schedule("0 0 * * *", () => {
    logger.info("Cron: Starting daily database backup...");
    runBackup();
});

const app = express();
export default app;

// Performance Middlewares
app.use(compression());
app.use(responseTime());

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // In dev, allow everything. In prod, strict check.
    if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
    } else {
        if (origin === process.env.FRONTEND_URL) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};
app.use(cors(corsOptions));

// Set security HTTP headers
app.use(helmet());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Data sanitization against NoSQL query injection
// Note: Even if we use MySQL, mongoSanitize helps strip out object injections like {$gt: ""}
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// LOGGING & PERFORMANCE TRACKING
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.headers['x-forwarded-for'];
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms | IP: ${ip}`);
  });
  next();
});

// AUTH EXTRACTION & ACTIVITY TRACKING
app.use(extractUser);

app.use(trackUserActivity);
app.use(logVisits);

// CSRF PROTECTION (Simple Double Submit Cookie)
const csrfProtection = (req, res, next) => {
    // Skip GET, HEAD, OPTIONS and Auth Login/Register/Reset
    if (["GET", "HEAD", "OPTIONS"].includes(req.method) || 
        req.originalUrl === "/api/auth/login" || 
        req.originalUrl === "/api/auth/register" ||
        req.originalUrl === "/api/auth/forgot-password" ||
        req.originalUrl === "/api/auth/reset-password") {
        // Set CSRF token cookie if not present
        if (!req.cookies.csrfToken) {
            const token = Math.random().toString(36).substring(2);
            res.cookie('csrfToken', token, { 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
        }
        return next();
    }

    const cookieToken = req.cookies.csrfToken;
    const headerToken = req.headers['x-csrf-token'];

    // STRICT COMPARISON
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        console.warn(`[SECURITY] CSRF blocked | Method: ${req.method} | Cookie: ${!!cookieToken} | Header: ${!!headerToken}`);
        return res.status(403).json({ error: "CSRF verification failed" });
    }
    next();
};
app.use(csrfProtection);

// Health Check
app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use(passport.initialize());

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // Increased to 600 to accommodate rich UI components and dev-mode double firing
  message: { error: "Too many requests, please slow down." }
});
app.use("/api/", globalLimiter);

// Rate Limiting Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15,
  message: { error: "Too many login attempts, please try again later" }
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ROUTES
app.use("/api/auth", authRoutes);

// OAuth Flow with Cookies
const handleOAuthCallback = async (req, res) => {
    try {
        const user = req.user;
        const accessToken = signAccessToken(user);
        const { token: refreshToken, hash: refreshTokenHash } = signRefreshToken(user);

        const pool = await connectDB();

        // Enforce Session Limit (Max 5)
        const [sessions] = await pool.execute(
            `SELECT id FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()`,
            [user.id]
        );
        if (sessions.length >= 5) {
            await pool.execute(
                `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?`,
                [sessions[0].id]
            );
        }

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await pool.execute(
            `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_fingerprint, ip_address) VALUES (?, ?, ?, ?, ?)`,
            [user.id, refreshTokenHash, expiresAt, getFingerprint(req), req.ip]
        );

        const COOKIE_OPTIONS = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
        };

        res.cookie('accessToken', accessToken, { 
            ...COOKIE_OPTIONS, 
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie('refreshToken', refreshToken, { 
            ...COOKIE_OPTIONS, 
            path: '/api/auth/refresh-token', 
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?success=true`);
    } catch (err) {
        logger.error("OAuth Callback Error", err);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
};

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/api/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  handleOAuthCallback
);

app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/api/auth/github/callback', 
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  handleOAuthCallback
);

app.use("/api/houses", houseRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock-requests", stockRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/entertainment", entertainmentRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/houses-excel", excelRoutes);
app.use("/api/admin/user-activity", activityRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/tv", tvRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/digital-products", digitalRoutes);
app.use("/api/admin/digital-products", adminDigitalRoutes);
app.use("/api/admin/system-tools", adminToolsRoutes);
app.use("/api/vocabulary-learning", vocabularyRoutes);

// Catch unhandled routes (404)
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

const port = Number(process.env.PORT || 3000);
const httpServer = createServer(app);

// Initialize Redis & Socket.IO
await initRedis();
await initSocket(httpServer);

const server = httpServer.listen(port, "0.0.0.0", async () => {
  logger.info(`🚀 [Production Ready] Server running on port ${port}`);
  try {
    await connectDB();
    // Auto-run migrations on start
    await initDb();
  } catch (err) {
    logger.error("Database connection failed", err);
  }
});

// Set server timeout to 65s for Keep-Alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.timeout = 65000;
