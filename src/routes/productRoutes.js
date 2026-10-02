
import express from "express";

import {
  getProducts,
  getProduct,
  createProductController,
  updateProductController,
  deleteProductController,
  addImagesToProduct,
  uploadProductImagesController,
  deleteProductImageController,
  getTrendingProductsController,
  updateProductImageController,
  reorderProductImagesController,
  setPrimaryProductImageController,
  getPopularProductsController
} from "../controllers/productController.js";

import upload from "../middleware/uploadMiddleware.js";
import validateImage from "../middleware/validateImageMiddleware.js";

import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin only

router.post(
  "/",
  protect,
  restrictTo("admin"),
  createProductController
);

router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  updateProductController
);
router.get("/popular", getPopularProductsController);

router.get("/trending", getTrendingProductsController);

router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  deleteProductController
);

// Admin only - upload product images
router.post(
  "/:id/images/upload",
  protect,
  restrictTo("admin"),
  upload.array("images", 10),
  validateImage,
  uploadProductImagesController
);

// Admin only - add product images
router.post(
  "/:id/images",
  protect,
  restrictTo("admin"),
  addImagesToProduct
);

// Admin only - reorder product images
router.put(
  "/:id/images/reorder",
  protect,
  restrictTo("admin"),
  reorderProductImagesController
);

// Admin only - delete product image
router.delete(
  "/:productId/images/:imageId",
  protect,
  restrictTo("admin"),
  deleteProductImageController
);

// Admin only - update/replace product image
router.put(
  "/:productId/images/:imageId",
  protect,
  restrictTo("admin"),
  updateProductImageController
);

// Admin only - set primary product image
router.put(
  "/:productId/images/:imageId/primary",
  protect,
  restrictTo("admin"),
  setPrimaryProductImageController
);


// Public routes
router.get("/", getProducts);

router.get("/:id", getProduct);

export default router;
