import express from "express";

import {
  createOrderController,
  getMyOrdersController,
  getMyOrderByIdController,
  getAllOrdersController,
  getAdminOrderByIdController,
  updateOrderStatusController,
  updatePaymentStatusController,
  cancelMyOrderController,
} from "../controllers/orderController.js";

import {
  protect,
  restrictTo,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Create order
router.post(
  "/",
  protect,
  createOrderController
);

// Get logged-in customer's orders
router.get(
  "/my-orders",
  protect,
  getMyOrdersController
);

// Get all orders - Admin only
router.get(
  "/admin/all",
  protect,
  restrictTo("admin"),
  getAllOrdersController
);

// Get single order - Admin only
router.get(
  "/admin/:id",
  protect,
  restrictTo("admin"),
  getAdminOrderByIdController
);

// Update order status - Admin only
router.put(
  "/admin/:id/status",
  protect,
  restrictTo("admin"),
  updateOrderStatusController
);

router.get(
  "/my-orders/:id",
  protect,
  getMyOrderByIdController
);

// Cancel logged-in customer's own order
router.put(
  "/my-orders/:id/cancel",
  protect,
  cancelMyOrderController
);

// Update payment status - Admin only
router.put(
  "/admin/:id/payment-status",
  protect,
  restrictTo("admin"),
  updatePaymentStatusController
);

export default router;