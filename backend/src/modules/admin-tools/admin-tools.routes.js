import express from "express";
import * as controller from "./admin-tools.controller.js";
import { requireAdmin } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Only admin allowed to access system utility tools
router.use(requireAdmin);

router.post("/auto-form/start", controller.startAutoForm);
router.post("/auto-form/stop", controller.stopAutoForm);
router.get("/auto-form/status", controller.getStatus);

export default router;
