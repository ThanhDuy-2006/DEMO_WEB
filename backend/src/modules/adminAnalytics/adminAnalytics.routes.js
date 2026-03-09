import express from "express";
import controller from "./adminAnalytics.controller.js";
import { requireAdmin } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAdmin); // Protect all routes

router.get("/heatmap", controller.getTrafficHeatmap);
router.get("/revenue", controller.getRevenueByDay);
router.get("/hourly-tx", controller.getHourlyTransactions);
router.get("/conversion", controller.getConversionRate);
router.get("/top-products", controller.getTopProducts);
router.get("/top-houses", controller.getTopHouses);

export default router;
