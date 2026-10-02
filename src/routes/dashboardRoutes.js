import express from "express";

import {
  getDashboardOverviewController,
  getRecentOrdersController,
  getProductStatsController,
  getUserStatsController,
  getSalesSummaryController,
} from "../controllers/dashboardController.js";
import {
  protect,
  restrictTo,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/overview",
  protect,
  restrictTo("admin"),
  getDashboardOverviewController
);
router.get(
  "/recent-orders",
  protect,
  restrictTo("admin"),
  getRecentOrdersController
);

router.get(
  "/product-stats",
  protect,
  restrictTo("admin"),
  getProductStatsController
);

router.get(
  "/user-stats",
  protect,
  restrictTo("admin"),
  getUserStatsController
);

router.get(
  "/sales-summary",
  protect,
  restrictTo("admin"),
  getSalesSummaryController
);

export default router;