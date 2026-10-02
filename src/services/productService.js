import pool from "../config/db.js";
import AppError from "../utils/Apperror.js";
import { deleteImageFromCloudinary } from "./cloudinaryService.js";

const isValidPositiveInteger = (value) => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

const isValidNonNegativeInteger = (value) => {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
};

const isValidNonNegativeNumber = (value) => {
  return Number.isFinite(Number(value)) && Number(value) >= 0;
};

export const getAllProducts = async ({
  category,
  minPrice,
  maxPrice,
  search,
  sizes = [],
  colors = [],
  inStock,
  sortBy = "featured",
}) => {
  const conditions = [];
  const values = [];

  let query = `
    SELECT
      p.id,
      p.category_id,
      c.name AS category_name,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.compare_price,
      p.stock,
      p.sku,
      p.sizes,
      p.colors,
      p.is_featured,
      p.is_active,
      p.created_at,
      p.updated_at,

      COALESCE(
        json_agg(
          pi.image_url
          ORDER BY pi.sort_order ASC, pi.id ASC
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS images

    FROM products p

    LEFT JOIN categories c
      ON p.category_id = c.id

    LEFT JOIN product_images pi
      ON p.id = pi.product_id
  `;

 if (category !== undefined && category !== "") {
  if (typeof category !== "string") {
    throw new AppError("Invalid category", 400);
  }

  const trimmedCategory = category.trim();

  if (trimmedCategory) {
    if (/^\d+$/.test(trimmedCategory)) {
      values.push(Number(trimmedCategory));
      conditions.push(`p.category_id = $${values.length}`);
    } else {
      values.push(trimmedCategory);
      conditions.push(`c.slug = $${values.length}`);
    }
  }
}

  if (minPrice !== undefined && minPrice !== "") {
    if (!isValidNonNegativeNumber(minPrice)) {
      throw new AppError(
        "Minimum price must be a valid non-negative number",
        400
      );
    }

    values.push(Number(minPrice));
    conditions.push(`p.price >= $${values.length}`);
  }

  if (maxPrice !== undefined && maxPrice !== "") {
    if (!isValidNonNegativeNumber(maxPrice)) {
      throw new AppError(
        "Maximum price must be a valid non-negative number",
        400
      );
    }

    values.push(Number(maxPrice));
    conditions.push(`p.price <= $${values.length}`);
  }

  if (
    minPrice !== undefined &&
    minPrice !== "" &&
    maxPrice !== undefined &&
    maxPrice !== "" &&
    Number(minPrice) > Number(maxPrice)
  ) {
    throw new AppError(
      "Minimum price cannot be greater than maximum price",
      400
    );
  }

  if (search !== undefined && search !== "") {
    if (typeof search !== "string") {
      throw new AppError("Search must be a string", 400);
    }

    const trimmedSearch = search.trim();

    if (trimmedSearch.length > 100) {
      throw new AppError(
        "Search must be 100 characters or less",
        400
      );
    }

    if (trimmedSearch) {
      values.push(`%${trimmedSearch}%`);

      conditions.push(`(
        p.name ILIKE $${values.length}
        OR p.description ILIKE $${values.length}
      )`);
    }
  }

    if (Array.isArray(sizes) && sizes.length > 0) {
    const cleanSizes = sizes.filter(
      (size) => typeof size === "string" && size.trim()
    );

    if (cleanSizes.length > 0) {
      values.push(cleanSizes.map((size) => size.trim()));

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(p.sizes) AS product_size
          WHERE product_size = ANY($${values.length})
        )
      `);
    }
  }

    if (Array.isArray(colors) && colors.length > 0) {
    const cleanColors = colors.filter(
      (color) => typeof color === "string" && color.trim()
    );

    if (cleanColors.length > 0) {
      values.push(cleanColors.map((color) => color.trim()));

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.colors) AS product_color
          WHERE product_color->>'name' = ANY($${values.length})
        )
      `);
    }
  }

    if (inStock === "true" || inStock === true) {
    conditions.push("p.stock > 0");
  }

  conditions.push("p.is_active = true");
  conditions.push("(c.is_active = true OR c.id IS NULL)");

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += `
    GROUP BY
      p.id,
      p.category_id,
      c.name,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.compare_price,
      p.stock,
      p.sku,
      p.sizes,
      p.colors,
      p.is_featured,
      p.is_active,
      p.created_at,
      p.updated_at
  `;

   const sortOptions = {
    featured: "p.is_featured DESC, p.created_at DESC",
    newest: "p.created_at DESC",
    "price-low": "p.price ASC",
    "price-high": "p.price DESC",
    popular: "p.is_featured DESC, p.created_at DESC",
    trending: "p.created_at DESC",
  };

  const selectedSort = sortOptions[sortBy] || sortOptions.featured;

  query += ` ORDER BY ${selectedSort}`;

  const result = await pool.query(query, values);

  return result.rows;
};

export const getProductById = async (id) => {
  if (!isValidPositiveInteger(id)) {
    throw new AppError("Invalid product ID", 400);
  }

  const productId = Number(id);

  const productResult = await pool.query(
    `SELECT
       p.id,
       p.category_id,
       c.name AS category_name,
       p.name,
       p.slug,
       p.description,
       p.price,
       p.compare_price,
       p.stock,
       p.sku,
       p.sizes,
       p.colors,
       p.is_featured,
       p.is_active,
       p.created_at,
       p.updated_at
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1
       AND p.is_active = true
       AND (c.is_active = true OR c.id IS NULL)`,
    [productId]
  );

  if (productResult.rows.length === 0) {
    throw new AppError("Product not found", 404);
  }

  const imagesResult = await pool.query(
    `SELECT
       id,
       product_id,
       image_url,
       cloudinary_public_id,
       alt_text,
       sort_order,
       is_primary
     FROM product_images
     WHERE product_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [productId]
  );

  return {
    ...productResult.rows[0],
    images: imagesResult.rows,
  };
};

export const createProduct = async ({
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
}) => {
  if (typeof name !== "string" || !name.trim()) {
    throw new AppError("Product name is required", 400);
  }

  if (name.trim().length > 150) {
    throw new AppError(
      "Product name must be 150 characters or less",
      400
    );
  }

  if (typeof slug !== "string" || !slug.trim()) {
    throw new AppError("Product slug is required", 400);
  }

  if (slug.trim().length > 150) {
    throw new AppError(
      "Product slug must be 150 characters or less",
      400
    );
  }

  if (!isValidNonNegativeNumber(price)) {
    throw new AppError(
      "Price must be a valid non-negative number",
      400
    );
  }

  const numericPrice = Number(price);

  let numericComparePrice = null;

  if (
    compare_price !== undefined &&
    compare_price !== null &&
    compare_price !== ""
  ) {
    if (!isValidNonNegativeNumber(compare_price)) {
      throw new AppError(
        "Compare price must be a valid non-negative number",
        400
      );
    }

    numericComparePrice = Number(compare_price);

    if (numericComparePrice < numericPrice) {
      throw new AppError(
        "Compare price cannot be less than product price",
        400
      );
    }
  }

  let numericStock = 0;

  if (stock !== undefined && stock !== null && stock !== "") {
    if (!isValidNonNegativeInteger(stock)) {
      throw new AppError(
        "Stock must be a valid non-negative integer",
        400
      );
    }

    numericStock = Number(stock);
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    throw new AppError("Description must be a string", 400);
  }

  if (
    sku !== undefined &&
    sku !== null &&
    sku !== "" &&
    typeof sku !== "string"
  ) {
    throw new AppError("SKU must be a string", 400);
  }

  const cleanName = name.trim();
  const cleanSlug = slug.trim().toLowerCase();

  const cleanDescription =
    typeof description === "string"
      ? description.trim()
      : null;

  const cleanSku =
    typeof sku === "string" && sku.trim()
      ? sku.trim()
      : null;

  const cleanSizes = Array.isArray(sizes)
    ? sizes
        .filter(
          (size) =>
            typeof size === "string" && size.trim()
        )
        .map((size) => size.trim())
    : [];

  const cleanColors = Array.isArray(colors)
    ? colors
        .filter(
          (color) =>
            color &&
            typeof color === "object" &&
            typeof color.name === "string" &&
            color.name.trim()
        )
        .map((color) => ({
          name: color.name.trim(),
          hex:
            typeof color.hex === "string"
              ? color.hex.trim()
              : "",
        }))
    : [];

  const existingProduct = await pool.query(
    "SELECT id FROM products WHERE slug = $1",
    [cleanSlug]
  );

  if (existingProduct.rows.length > 0) {
    throw new AppError("Product slug already exists", 409);
  }

  if (cleanSku) {
    const existingSku = await pool.query(
      "SELECT id FROM products WHERE sku = $1",
      [cleanSku]
    );

    if (existingSku.rows.length > 0) {
      throw new AppError("Product SKU already exists", 409);
    }
  }

  let finalCategoryId = null;

  if (
    category_id !== undefined &&
    category_id !== null &&
    category_id !== ""
  ) {
    if (!isValidPositiveInteger(category_id)) {
      throw new AppError("Invalid category ID", 400);
    }

    finalCategoryId = Number(category_id);

    const categoryResult = await pool.query(
      "SELECT id FROM categories WHERE id = $1",
      [finalCategoryId]
    );

    if (categoryResult.rows.length === 0) {
      throw new AppError("Category not found", 404);
    }
  }

  const result = await pool.query(
    `INSERT INTO products (
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
      colors
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11
    )
    RETURNING
      id,
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
      is_active,
      created_at,
      updated_at`,
    [
      finalCategoryId,
      cleanName,
      cleanSlug,
      cleanDescription,
      numericPrice,
      numericComparePrice,
      numericStock,
      cleanSku,
      is_featured ?? false,
      JSON.stringify(cleanSizes),
      JSON.stringify(cleanColors),
    ]
  );

  return result.rows[0];
};

export const updateProduct = async (
  productId,
  {
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
  }
) => {
  if (!isValidPositiveInteger(productId)) {
    throw new AppError("Invalid product ID", 400);
  }

  const numericProductId = Number(productId);

  const existingProduct = await pool.query(
    `SELECT
       id,
       category_id,
       sizes,
       colors
     FROM products
     WHERE id = $1`,
    [numericProductId]
  );

  if (existingProduct.rows.length === 0) {
    throw new AppError("Product not found", 404);
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new AppError("Product name is required", 400);
  }

  if (typeof slug !== "string" || !slug.trim()) {
    throw new AppError("Product slug is required", 400);
  }

  if (!isValidNonNegativeNumber(price)) {
    throw new AppError(
      "Price must be a valid non-negative number",
      400
    );
  }

  const numericPrice = Number(price);

  let numericComparePrice = null;

  if (
    compare_price !== undefined &&
    compare_price !== null &&
    compare_price !== ""
  ) {
    if (!isValidNonNegativeNumber(compare_price)) {
      throw new AppError(
        "Compare price must be a valid non-negative number",
        400
      );
    }

    numericComparePrice = Number(compare_price);

    if (numericComparePrice < numericPrice) {
      throw new AppError(
        "Compare price cannot be less than product price",
        400
      );
    }
  }

  let numericStock = 0;

  if (stock !== undefined && stock !== null && stock !== "") {
    if (!isValidNonNegativeInteger(stock)) {
      throw new AppError(
        "Stock must be a valid non-negative integer",
        400
      );
    }

    numericStock = Number(stock);
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    throw new AppError("Description must be a string", 400);
  }

  if (
    sku !== undefined &&
    sku !== null &&
    sku !== "" &&
    typeof sku !== "string"
  ) {
    throw new AppError("SKU must be a string", 400);
  }

  const cleanName = name.trim();
  const cleanSlug = slug.trim().toLowerCase();

  const cleanDescription =
    typeof description === "string"
      ? description.trim()
      : null;

  const cleanSku =
    typeof sku === "string" && sku.trim()
      ? sku.trim()
      : null;

  const cleanSizes =
    sizes !== undefined
      ? Array.isArray(sizes)
        ? sizes
            .filter(
              (size) =>
                typeof size === "string" &&
                size.trim()
            )
            .map((size) => size.trim())
        : []
      : existingProduct.rows[0].sizes || [];

  const cleanColors =
    colors !== undefined
      ? Array.isArray(colors)
        ? colors
            .filter(
              (color) =>
                color &&
                typeof color === "object" &&
                typeof color.name === "string" &&
                color.name.trim()
            )
            .map((color) => ({
              name: color.name.trim(),
              hex:
                typeof color.hex === "string"
                  ? color.hex.trim()
                  : "",
            }))
        : []
      : existingProduct.rows[0].colors || [];

  const finalCategoryId =
    category_id !== undefined
      ? category_id === null || category_id === ""
        ? null
        : Number(category_id)
      : existingProduct.rows[0].category_id;

  if (
    finalCategoryId !== null &&
    !isValidPositiveInteger(finalCategoryId)
  ) {
    throw new AppError("Invalid category ID", 400);
  }

  if (cleanSlug) {
    const existingSlug = await pool.query(
      "SELECT id FROM products WHERE slug = $1 AND id != $2",
      [cleanSlug, numericProductId]
    );

    if (existingSlug.rows.length > 0) {
      throw new AppError(
        "Product slug already exists",
        409
      );
    }
  }

  if (cleanSku) {
    const existingSku = await pool.query(
      "SELECT id FROM products WHERE sku = $1 AND id != $2",
      [cleanSku, numericProductId]
    );

    if (existingSku.rows.length > 0) {
      throw new AppError(
        "Product SKU already exists",
        409
      );
    }
  }

  if (finalCategoryId !== null) {
    const categoryResult = await pool.query(
      "SELECT id FROM categories WHERE id = $1",
      [finalCategoryId]
    );

    if (categoryResult.rows.length === 0) {
      throw new AppError("Category not found", 404);
    }
  }

  const result = await pool.query(
    `UPDATE products
     SET
       category_id = $1,
       name = $2,
       slug = $3,
       description = $4,
       price = $5,
       compare_price = $6,
       stock = $7,
       sku = $8,
       is_featured = $9,
       sizes = $10,
       colors = $11,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $12
     RETURNING
       id,
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
       is_active,
       created_at,
       updated_at`,
    [
      finalCategoryId,
      cleanName,
      cleanSlug,
      cleanDescription,
      numericPrice,
      numericComparePrice,
      numericStock,
      cleanSku,
      is_featured ?? false,
      JSON.stringify(cleanSizes),
      JSON.stringify(cleanColors),
      numericProductId,
    ]
  );

  return result.rows[0];
};

export const addProductImages = async (productId, images) => {
  if (!isValidPositiveInteger(productId)) {
    throw new AppError("Invalid product ID", 400);
  }

  const numericProductId = Number(productId);

  const productResult = await pool.query(
    "SELECT id FROM products WHERE id = $1",
    [numericProductId]
  );

  if (productResult.rows.length === 0) {
    throw new AppError("Product not found", 404);
  }

  if (!Array.isArray(images) || images.length === 0) {
    throw new AppError(
      "At least one image is required",
      400
    );
  }

  if (images.length > 10) {
    throw new AppError(
      "Maximum 10 images can be added at once",
      400
    );
  }

  const insertedImages = [];

  for (const image of images) {
    if (!image || typeof image !== "object") {
      throw new AppError("Invalid image data", 400);
    }

    const {
      image_url,
      cloudinary_public_id,
      alt_text,
      sort_order = 0,
    } = image;

    if (
      typeof image_url !== "string" ||
      !image_url.trim()
    ) {
      throw new AppError(
        "Image URL is required",
        400
      );
    }

    if (
      cloudinary_public_id !== undefined &&
      cloudinary_public_id !== null &&
      typeof cloudinary_public_id !== "string"
    ) {
      throw new AppError(
        "Cloudinary public ID must be a string",
        400
      );
    }

    if (!isValidNonNegativeInteger(sort_order)) {
      throw new AppError(
        "Sort order must be a valid non-negative integer",
        400
      );
    }

    if (
      alt_text !== undefined &&
      alt_text !== null &&
      typeof alt_text !== "string"
    ) {
      throw new AppError(
        "Alt text must be a string",
        400
      );
    }

    const result = await pool.query(
      `INSERT INTO product_images
       (
         product_id,
         image_url,
         cloudinary_public_id,
         alt_text,
         sort_order
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id,
         product_id,
         image_url,
         cloudinary_public_id,
         alt_text,
         sort_order`,
      [
        numericProductId,
        image_url.trim(),
        typeof cloudinary_public_id === "string" &&
        cloudinary_public_id.trim()
          ? cloudinary_public_id.trim()
          : null,
        typeof alt_text === "string"
          ? alt_text.trim()
          : null,
        Number(sort_order),
      ]
    );

    insertedImages.push(result.rows[0]);
  }

  return insertedImages;
};

export const deleteProductImage = async (
  productId,
  imageId
) => {
  if (!isValidPositiveInteger(productId)) {
    throw new AppError(
      "Invalid product ID",
      400
    );
  }

  if (!isValidPositiveInteger(imageId)) {
    throw new AppError(
      "Invalid image ID",
      400
    );
  }

  const numericProductId = Number(productId);
  const numericImageId = Number(imageId);

  const imageResult = await pool.query(
    `SELECT
       id,
       cloudinary_public_id
     FROM product_images
     WHERE id = $1 AND product_id = $2`,
    [numericImageId, numericProductId]
  );

  if (imageResult.rows.length === 0) {
    throw new AppError(
      "Product image not found",
      404
    );
  }

  const image = imageResult.rows[0];

  if (image.cloudinary_public_id) {
    try {
      await deleteImageFromCloudinary(
        image.cloudinary_public_id
      );
    } catch (error) {
      console.error(
        "Cloudinary image deletion failed:",
        error.message
      );

      throw new AppError(
        "Failed to delete image from Cloudinary",
        500
      );
    }
  }

  const result = await pool.query(
    `DELETE FROM product_images
     WHERE id = $1 AND product_id = $2
     RETURNING
       id,
       product_id,
       image_url,
       cloudinary_public_id,
       alt_text,
       sort_order`,
    [numericImageId, numericProductId]
  );

  return result.rows[0];
};

export const updateProductImage = async (
  productId,
  imageId,
  { image_url, alt_text, sort_order }
) => {
  if (!isValidPositiveInteger(productId)) {
    throw new AppError(
      "Invalid product ID",
      400
    );
  }

  if (!isValidPositiveInteger(imageId)) {
    throw new AppError(
      "Invalid image ID",
      400
    );
  }

  const numericProductId = Number(productId);
  const numericImageId = Number(imageId);

  const imageResult = await pool.query(
    `SELECT id
     FROM product_images
     WHERE id = $1 AND product_id = $2`,
    [numericImageId, numericProductId]
  );

  if (imageResult.rows.length === 0) {
    throw new AppError(
      "Product image not found",
      404
    );
  }

  if (
    typeof image_url !== "string" ||
    !image_url.trim()
  ) {
    throw new AppError(
      "Image URL is required",
      400
    );
  }

  const numericSortOrder =
    sort_order === undefined ||
    sort_order === null ||
    sort_order === ""
      ? 0
      : Number(sort_order);

  if (!isValidNonNegativeInteger(numericSortOrder)) {
    throw new AppError(
      "Sort order must be a valid non-negative integer",
      400
    );
  }

  if (
    alt_text !== undefined &&
    alt_text !== null &&
    typeof alt_text !== "string"
  ) {
    throw new AppError(
      "Alt text must be a string",
      400
    );
  }

  const result = await pool.query(
    `UPDATE product_images
     SET
       image_url = $1,
       alt_text = $2,
       sort_order = $3
     WHERE id = $4 AND product_id = $5
     RETURNING
       id,
       product_id,
       image_url,
       cloudinary_public_id,
       alt_text,
       sort_order`,
    [
      image_url.trim(),
      typeof alt_text === "string"
        ? alt_text.trim()
        : null,
      numericSortOrder,
      numericImageId,
      numericProductId,
    ]
  );

  return result.rows[0];
};

export const reorderProductImages = async (
  productId,
  imageOrders
) => {
  if (!isValidPositiveInteger(productId)) {
    throw new AppError(
      "Invalid product ID",
      400
    );
  }

  const numericProductId = Number(productId);

  const productResult = await pool.query(
    "SELECT id FROM products WHERE id = $1",
    [numericProductId]
  );

  if (productResult.rows.length === 0) {
    throw new AppError(
      "Product not found",
      404
    );
  }

  if (
    !Array.isArray(imageOrders) ||
    imageOrders.length === 0
  ) {
    throw new AppError(
      "Image order data is required",
      400
    );
  }

  if (imageOrders.length > 50) {
    throw new AppError(
      "Too many image order records",
      400
    );
  }

  for (const image of imageOrders) {
    if (!image || typeof image !== "object") {
      throw new AppError(
        "Invalid image order data",
        400
      );
    }

    const {
      image_id,
      sort_order,
    } = image;

    if (!isValidPositiveInteger(image_id)) {
      throw new AppError(
        "image_id must be a valid positive integer",
        400
      );
    }

    if (!isValidNonNegativeInteger(sort_order)) {
      throw new AppError(
        "sort_order must be a valid non-negative integer",
        400
      );
    }

    const result = await pool.query(
      `UPDATE product_images
       SET sort_order = $1
       WHERE id = $2 AND product_id = $3
       RETURNING id`,
      [
        Number(sort_order),
        Number(image_id),
        numericProductId,
      ]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        `Product image ${image_id} not found`,
        404
      );
    }
  }

  const result = await pool.query(
    `SELECT
       id,
       product_id,
       image_url,
       cloudinary_public_id,
       alt_text,
       sort_order,
       is_primary
     FROM product_images
     WHERE product_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [numericProductId]
  );

  return result.rows;
};

export const setPrimaryProductImage = async (
  productId,
  imageId
) => {
  if (!isValidPositiveInteger(productId)) {
    throw new AppError(
      "Invalid product ID",
      400
    );
  }

  if (!isValidPositiveInteger(imageId)) {
    throw new AppError(
      "Invalid image ID",
      400
    );
  }

  const numericProductId = Number(productId);
  const numericImageId = Number(imageId);

  const productResult = await pool.query(
    "SELECT id FROM products WHERE id = $1",
    [numericProductId]
  );

  if (productResult.rows.length === 0) {
    throw new AppError(
      "Product not found",
      404
    );
  }

  const imageResult = await pool.query(
    `SELECT id
     FROM product_images
     WHERE id = $1 AND product_id = $2`,
    [numericImageId, numericProductId]
  );

  if (imageResult.rows.length === 0) {
    throw new AppError(
      "Product image not found",
      404
    );
  }

  await pool.query(
    `UPDATE product_images
     SET is_primary = false
     WHERE product_id = $1`,
    [numericProductId]
  );

  const result = await pool.query(
    `UPDATE product_images
     SET is_primary = true
     WHERE id = $1 AND product_id = $2
     RETURNING
       id,
       product_id,
       image_url,
       cloudinary_public_id,
       alt_text,
       sort_order,
       is_primary`,
    [numericImageId, numericProductId]
  );

  return result.rows[0];
};

export const deleteProduct = async (productId) => {
  if (!isValidPositiveInteger(productId)) {
    throw new AppError(
      "Invalid product ID",
      400
    );
  }

  const numericProductId = Number(productId);

  const existingProduct = await pool.query(
    `SELECT id, name, slug
     FROM products
     WHERE id = $1`,
    [numericProductId]
  );

  if (existingProduct.rows.length === 0) {
    throw new AppError(
      "Product not found",
      404
    );
  }

  const imagesResult = await pool.query(
    `SELECT cloudinary_public_id
     FROM product_images
     WHERE product_id = $1
       AND cloudinary_public_id IS NOT NULL`,
    [numericProductId]
  );

  const result = await pool.query(
    `DELETE FROM products
     WHERE id = $1
     RETURNING
       id,
       name,
       slug`,
    [numericProductId]
  );

  const cloudinaryPublicIds = imagesResult.rows
    .map(
      (image) => image.cloudinary_public_id
    )
    .filter(Boolean);

  for (const publicId of cloudinaryPublicIds) {
    try {
      await deleteImageFromCloudinary(
        publicId
      );
    } catch (error) {
      console.error(
        `Failed to delete Cloudinary image ${publicId}:`,
        error.message
      );
    }
  }

  return result.rows[0];
};


export const getTrendingProducts = async (limit = 12) => {
  const numericLimit = Number(limit);

  if (
    !Number.isInteger(numericLimit) ||
    numericLimit <= 0 ||
    numericLimit > 50
  ) {
    throw new AppError(
      "Limit must be a positive integer between 1 and 50",
      400
    );
  }

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.category_id,
      c.name AS category_name,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.compare_price,
      p.stock,
      p.sizes,
      p.colors,
      p.is_featured,
      p.is_active,

      COALESCE(views.count, 0) AS views,
      COALESCE(wishlist.count, 0) AS wishlist_adds,
      COALESCE(cart.count, 0) AS cart_adds,
      COALESCE(whatsapp.count, 0) AS whatsapp_clicks,
      COALESCE(orders.count, 0) AS orders,

      (
        COALESCE(views.count, 0) * 1
        + COALESCE(wishlist.count, 0) * 3
        + COALESCE(cart.count, 0) * 5
        + COALESCE(whatsapp.count, 0) * 8
        + COALESCE(orders.count, 0) * 10
      ) AS trending_score,

      COALESCE(
        (
          SELECT json_agg(pi.image_url ORDER BY pi.sort_order ASC, pi.id ASC)
          FROM product_images pi
          WHERE pi.product_id = p.id
        ),
        '[]'
      ) AS images

    FROM products p

    LEFT JOIN categories c
      ON c.id = p.category_id

    LEFT JOIN (
      SELECT
        product_id,
        COUNT(*) AS count
      FROM analytics_events
      WHERE event_name = 'product_view'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY product_id
    ) views
      ON views.product_id = p.id

    LEFT JOIN (
      SELECT
        product_id,
        COUNT(*) AS count
      FROM analytics_events
      WHERE event_name = 'wishlist_add'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY product_id
    ) wishlist
      ON wishlist.product_id = p.id

    LEFT JOIN (
      SELECT
        product_id,
        COUNT(*) AS count
      FROM analytics_events
      WHERE event_name = 'cart_add'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY product_id
    ) cart
      ON cart.product_id = p.id

    LEFT JOIN (
      SELECT
        product_id,
        COUNT(*) AS count
      FROM analytics_events
      WHERE event_name = 'whatsapp_order_clicked'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY product_id
    ) whatsapp
      ON whatsapp.product_id = p.id

    LEFT JOIN (
      SELECT
        oi.product_id,
        COUNT(DISTINCT oi.order_id) AS count
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
      WHERE o.status <> 'cancelled'
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY oi.product_id
    ) orders
      ON orders.product_id = p.id

    WHERE p.is_active = true
      AND (c.is_active = true OR c.id IS NULL)

    ORDER BY
      trending_score DESC,
      p.created_at DESC

    LIMIT $1
    `,
    [numericLimit]
  );

  return result.rows;
};


export const getPopularProducts = async (limit = 8) => {
  const numericLimit = Number(limit);

  if (
    !Number.isInteger(numericLimit) ||
    numericLimit <= 0 ||
    numericLimit > 50
  ) {
    throw new AppError(
      "Limit must be a positive integer between 1 and 50",
      400
    );
  }

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.category_id,
      c.name AS category_name,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.compare_price,
      p.stock,
      p.sizes,
      p.colors,
      p.is_featured,
      p.is_active,

      COALESCE(views.count, 0) AS views,
      COALESCE(wishlist.count, 0) AS wishlist_adds,
      COALESCE(cart.count, 0) AS cart_adds,
      COALESCE(whatsapp.count, 0) AS whatsapp_clicks,
      COALESCE(orders.count, 0) AS orders,

      (
        COALESCE(views.count, 0) * 1
        + COALESCE(wishlist.count, 0) * 3
        + COALESCE(cart.count, 0) * 5
        + COALESCE(whatsapp.count, 0) * 8
        + COALESCE(orders.count, 0) * 10
      ) AS popularity_score,

      COALESCE(
        (
          SELECT json_agg(
            pi.image_url
            ORDER BY pi.sort_order ASC, pi.id ASC
          )
          FROM product_images pi
          WHERE pi.product_id = p.id
        ),
        '[]'
      ) AS images

    FROM products p

    LEFT JOIN categories c
      ON c.id = p.category_id

    LEFT JOIN (
      SELECT product_id, COUNT(*) AS count
      FROM analytics_events
      WHERE event_name = 'product_view'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY product_id
    ) views
      ON views.product_id = p.id

    LEFT JOIN (
      SELECT product_id, COUNT(*) AS count
      FROM analytics_events
      WHERE event_name = 'wishlist_add'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY product_id
    ) wishlist
      ON wishlist.product_id = p.id

    LEFT JOIN (
      SELECT product_id, COUNT(*) AS count
      FROM analytics_events
      WHERE event_name = 'cart_add'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY product_id
    ) cart
      ON cart.product_id = p.id

    LEFT JOIN (
      SELECT product_id, COUNT(*) AS count
      FROM analytics_events
      WHERE event_name = 'whatsapp_order_clicked'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY product_id
    ) whatsapp
      ON whatsapp.product_id = p.id

    LEFT JOIN (
      SELECT
        oi.product_id,
        COUNT(DISTINCT oi.order_id) AS count
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
      WHERE o.status <> 'cancelled'
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY oi.product_id
    ) orders
      ON orders.product_id = p.id

    WHERE p.is_active = true
      AND (c.is_active = true OR c.id IS NULL)

    ORDER BY
      popularity_score DESC,
      p.created_at DESC

    LIMIT $1
    `,
    [numericLimit]
  );

  return result.rows;
};