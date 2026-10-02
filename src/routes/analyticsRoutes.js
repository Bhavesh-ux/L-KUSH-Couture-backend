import express from "express";

import {
  createAnalyticsEventController,
  getAnalyticsEventsController,
  getAnalyticsSummaryController,
  getAnalyticsDashboardSummaryController,
  getProductAnalyticsController,
  getDailyAnalyticsController,
  getDailyRevenueController,
  getCategoryPerformanceController
} from "../controllers/analyticsController.js";
import {
  protect,
  restrictTo,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  createAnalyticsEventController
);

router.get(
  "/",
  protect,
  restrictTo("admin"),
  getAnalyticsEventsController
);

router.get(
  "/summary",
  protect,
  restrictTo("admin"),
  getAnalyticsSummaryController
); 
router.get(
  "/dashboard-summary",
  protect,
  restrictTo("admin"),
  getAnalyticsDashboardSummaryController
);

router.get(
  "/product-analytics",
  protect,
  restrictTo("admin"),
  getProductAnalyticsController
);

router.get(
  "/daily-analytics",
  protect,
  restrictTo("admin"),
  getDailyAnalyticsController
);
router.get(
  '/daily-revenue',
  protect,
  restrictTo('admin'),
  getDailyRevenueController
);

router.get(
  "/category-performance",
  protect,
  restrictTo("admin"),
  getCategoryPerformanceController
);

export default router;