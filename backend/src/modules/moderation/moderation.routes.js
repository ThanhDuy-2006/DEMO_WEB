import express from "express";
import controller from "./moderation.controller.js";
import { verifyAccessToken, requireAdmin } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// User can create report
router.post("/report", verifyAccessToken, controller.createReport);

// Admin Routes
router.get("/reports", requireAdmin, controller.getReports);
router.put("/reports/:id/resolve", requireAdmin, controller.resolveReport);

export default router;
