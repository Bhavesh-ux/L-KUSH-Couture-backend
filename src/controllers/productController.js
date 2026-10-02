import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
  updateProductImage,
  reorderProductImages,
  setPrimaryProductImage,
  getTrendingProducts,
  getPopularProducts
} from "../services/productService.js";

import { uploadImageToCloudinary } from "../services/cloudinaryService.js";

export const getProducts = async (req, res, next) => {
  try {
    const {
  category,
  minPrice,
  maxPrice,
  search,
  size,
  color,
  inStock,
  sortBy,
} = req.query;

const sizes = size
  ? Array.isArray(size)
    ? size
    : [size]
  : [];

const colors = color
  ? Array.isArray(color)
    ? color
    : [color]
  : [];

  

const products = await getAllProducts({
  category,
  minPrice,
  maxPrice,
  search,
  sizes,
  colors,
  inStock,
  sortBy,
});

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingProductsController = async (
  req,
  res,
  next
) => {
  try {
    const limit =
      req.query.limit === undefined
        ? 12
        : Number(req.query.limit);

    const products = await getTrendingProducts(limit);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getPopularProductsController = async (
  req,
  res,
  next
) => {
  try {
    const limit =
      req.query.limit === undefined
        ? 8
        : Number(req.query.limit);

    const products = await getPopularProducts(limit);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProductController = async (
  req,
  res,
  next
) => {
  try {
    const {
      category_id,
      name,
      slug,
      description,
      price,
      compare_price,
      stock,
      sku,
      is_featured,
      sizes,
      colors,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, slug and price are required",
      });
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Price must be a valid non-negative number",
      });
    }

    let numericStock = 0;

    if (
      stock !== undefined &&
      stock !== null &&
      stock !== ""
    ) {
      numericStock = Number(stock);

      if (
        !Number.isInteger(numericStock) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid non-negative integer",
        });
      }
    }

    let numericComparePrice = null;

    if (
      compare_price !== undefined &&
      compare_price !== null &&
      compare_price !== ""
    ) {
      numericComparePrice = Number(compare_price);

      if (
        !Number.isFinite(numericComparePrice) ||
        numericComparePrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Compare price must be a valid non-negative number",
        });
      }

      if (numericComparePrice < numericPrice) {
        return res.status(400).json({
          success: false,
          message:
            "Compare price cannot be less than product price",
        });
      }
    }

    const product = await createProduct({
      category_id,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description,
      price: numericPrice,
      compare_price: numericComparePrice,
      stock: numericStock,
      sku,
      is_featured,
      sizes,
      colors,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const addImagesToProduct = async (
  req,
  res,
  next
) => {
  try {
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const productImages = await addProductImages(
      req.params.id,
      images
    );

    res.status(201).json({
      success: true,
      message: "Product images added successfully",
      data: productImages,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductController = async (
  req,
  res,
  next
) => {
  try {
    const {
      category_id,
      name,
      slug,
      description,
      price,
      compare_price,
      stock,
      sku,
      is_featured,
      sizes,
      colors,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !slug.trim() ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, slug and price are required",
      });
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Price must be a valid non-negative number",
      });
    }

    let numericStock = 0;

    if (
      stock !== undefined &&
      stock !== null &&
      stock !== ""
    ) {
      numericStock = Number(stock);

      if (
        !Number.isInteger(numericStock) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid non-negative integer",
        });
      }
    }

    let numericComparePrice = null;

    if (
      compare_price !== undefined &&
      compare_price !== null &&
      compare_price !== ""
    ) {
      numericComparePrice = Number(compare_price);

      if (
        !Number.isFinite(numericComparePrice) ||
        numericComparePrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Compare price must be a valid non-negative number",
        });
      }

      if (numericComparePrice < numericPrice) {
        return res.status(400).json({
          success: false,
          message:
            "Compare price cannot be less than product price",
        });
      }
    }

    const product = await updateProduct(
      req.params.id,
      {
        category_id,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description,
        price: numericPrice,
        compare_price: numericComparePrice,
        stock: numericStock,
        sku,
        is_featured,
        sizes,
        colors,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductImageController = async (
  req,
  res,
  next
) => {
  try {
    const {
      productId,
      imageId,
    } = req.params;

    const deletedImage = await deleteProductImage(
      productId,
      imageId
    );

    res.status(200).json({
      success: true,
      message: "Product image deleted successfully",
      data: deletedImage,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductImageController = async (
  req,
  res,
  next
) => {
  try {
    const {
      productId,
      imageId,
    } = req.params;

    const {
      image_url,
      alt_text,
      sort_order,
    } = req.body;

    if (
      typeof image_url !== "string" ||
      !image_url.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const updatedImage = await updateProductImage(
      productId,
      imageId,
      {
        image_url: image_url.trim(),
        alt_text,
        sort_order,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    next(error);
  }
};

export const reorderProductImagesController = async (
  req,
  res,
  next
) => {
  try {
    const { imageOrders } = req.body;

    if (
      !Array.isArray(imageOrders) ||
      imageOrders.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Image order data is required",
      });
    }

    const updatedImages = await reorderProductImages(
      req.params.id,
      imageOrders
    );

    res.status(200).json({
      success: true,
      message: "Product images reordered successfully",
      data: updatedImages,
    });
  } catch (error) {
    next(error);
  }
};

export const setPrimaryProductImageController = async (
  req,
  res,
  next
) => {
  try {
    const {
      productId,
      imageId,
    } = req.params;

    const primaryImage = await setPrimaryProductImage(
      productId,
      imageId
    );

    res.status(200).json({
      success: true,
      message:
        "Primary product image updated successfully",
      data: primaryImage,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProductImagesController = async (
  req,
  res,
  next
) => {
  try {
    if (
      !req.files ||
      req.files.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one image file is required",
      });
    }

    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images can be uploaded at once",
      });
    }

    const productId = req.params.id;

    const images = [];

    for (const file of req.files) {
      const result = await uploadImageToCloudinary(
        file.buffer,
        `l-kush/products/${productId}`
      );

      images.push({
        image_url: result.secure_url,
        cloudinary_public_id: result.public_id,
        alt_text: null,
        sort_order: 0,
      });
    }

    const savedImages = await addProductImages(
      productId,
      images
    );

    res.status(201).json({
      success: true,
      message: "Product images uploaded successfully",
      data: savedImages,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductController = async (
  req,
  res,
  next
) => {
  try {
    const product = await deleteProduct(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};