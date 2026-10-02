import express from "express";

import {
  addToWishlistController,
  getMyWishlistController,
  removeFromWishlistController,
} from "../controllers/wishlistController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Add product to wishlist
router.post(
  "/",
  protect,
  addToWishlistController
);

// Get logged-in customer's wishlist
router.get(
  "/",
  protect,
  getMyWishlistController
);

// Remove product from wishlist
router.delete(
  "/:productId",
  protect,
  removeFromWishlistController
);

export default router;