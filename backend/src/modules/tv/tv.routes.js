
import express from "express";
import controller from "./tv.controller.js";
import epgController from "./epg.controller.js";
import { verifyAccessToken } from "../../middlewares/authMiddleware.js";

import rateLimit from "express-rate-limit";

const router = express.Router();

const tvLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per windowMs
    message: { error: "Too many requests to TV API, please try again later." }
});

// Apply rate limit
router.use(tvLimiter);

// Required Login (User must be logged in to view)
router.use(verifyAccessToken);

// Get Channel List
router.get("/channels", controller.getChannels);

// Get EPG (Schedule)
router.get("/epg", epgController.getChannelEPG);

// Check Link (Timeout 3s)
router.get("/check", controller.checkStream);

// Proxy Stream (Avoid CORS)
router.get("/stream", controller.proxyStream);

export default router;
