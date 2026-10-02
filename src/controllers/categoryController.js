import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryImage,
  deleteCategory,
} from "../services/categoryService.js";

import {
  uploadImageToCloudinary,
} from "../services/cloudinaryService.js";

// -----------------------------------------
// GET ALL CATEGORIES
// -----------------------------------------
export const getCategories = async (
  req,
  res,
  next
) => {
  try {
    const categories =
      await getAllCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------
// GET CATEGORY BY ID
// -----------------------------------------
export const getCategory = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const category =
      await getCategoryById(id);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};


// -----------------------------------------
// CREATE CATEGORY
// -----------------------------------------
export const createCategoryController =
  async (req, res, next) => {
    try {
      const {
        name,
        slug,
        description,
        image_url,
      } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message:
            "Name and slug are required",
        });
      }

      const category =
        await createCategory({
          name: name.trim(),
          slug: slug.trim(),
          description:
            description?.trim() || null,
          image_url:
            image_url?.trim() || null,
        });

      res.status(201).json({
        success: true,
        message:
          "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };


// -----------------------------------------
// UPDATE CATEGORY
// -----------------------------------------
// -----------------------------------------
// UPDATE CATEGORY
// -----------------------------------------
export const updateCategoryController =
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const {
        name,
        slug,
        description,
        image_url,
        status,
      } = req.body;

      // Status-only update
      if (
        status === "active" ||
        status === "inactive"
      ) {
        const category =
          await updateCategory(id, {
            status,
          });

        return res.status(200).json({
          success: true,
          message:
            "Category status updated successfully",
          data: category,
        });
      }

      // Normal category update
      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message:
            "Name and slug are required",
        });
      }

      const category =
        await updateCategory(id, {
          name: name.trim(),
          slug: slug.trim(),
          description:
            description?.trim() || null,
          image_url:
            image_url?.trim() || null,
        });

      res.status(200).json({
        success: true,
        message:
          "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------------------
// UPLOAD CATEGORY IMAGE
// -----------------------------------------
export const uploadCategoryImageController =
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Category image file is required",
        });
      }

      if (req.files.length > 1) {
        return res.status(400).json({
          success: false,
          message: "Only one category image can be uploaded",
        });
      }

      const file = req.files[0];

      const result =
        await uploadImageToCloudinary(
          file.buffer,
          `l-kush/categories/${id}`
        );

      const category =
        await updateCategoryImage(
          id,
          result.secure_url
        );

      res.status(200).json({
        success: true,
        message:
          "Category image uploaded successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

// -----------------------------------------
// DELETE CATEGORY
// -----------------------------------------
export const deleteCategoryController =
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const category =
        await deleteCategory(id);

      res.status(200).json({
        success: true,
        message:
          "Category deleted successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };