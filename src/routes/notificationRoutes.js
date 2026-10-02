import express from "express";

import {
  getMyNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in customer's notifications
router.get(
  "/",
  protect,
  getMyNotificationsController
);

// Mark one notification as read
router.put(
  "/:id/read",
  protect,
  markNotificationAsReadController
);

// Mark all notifications as read
router.put(
  "/read-all",
  protect,
  markAllNotificationsAsReadController
);

export default router;