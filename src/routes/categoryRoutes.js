import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import validateImage from "../middleware/validateImageMiddleware.js";

import {
  getCategories,
  getCategory,
  createCategoryController,
  updateCategoryController,
  uploadCategoryImageController,
  deleteCategoryController,
} from "../controllers/categoryController.js";

import {
  protect,
  restrictTo,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// -----------------------------------------
// PUBLIC
// -----------------------------------------

// Get all categories
router.get(
  "/",
  getCategories
);

// Get single category
router.get(
  "/:id",
  getCategory
);

// -----------------------------------------
// ADMIN ONLY
// -----------------------------------------

// Create category
router.post(
  "/",
  protect,
  restrictTo("admin"),
  createCategoryController
);

// Update category
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  updateCategoryController
);

// Upload category image
router.post(
  "/:id/image",
  protect,
  restrictTo("admin"),
  upload.array("image", 1),
  validateImage,
  uploadCategoryImageController
);

// Delete category
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  deleteCategoryController
);

export default router;