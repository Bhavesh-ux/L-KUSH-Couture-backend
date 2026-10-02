import pool from "../config/db.js";
import AppError from "../utils/Apperror.js";

// -----------------------------------------
// GET ALL CATEGORIES
// -----------------------------------------
// -----------------------------------------
// GET ALL CATEGORIES
// -----------------------------------------
export const getAllCategories = async () => {
  const result = await pool.query(
    `SELECT
       c.id,
       c.name,
       c.slug,
       c.description,
       c.image_url,
       c.is_active,
       c.created_at,
       COUNT(p.id) AS item_count
     FROM categories c
     LEFT JOIN products p
       ON p.category_id = c.id
     GROUP BY
       c.id,
       c.name,
       c.slug,
       c.description,
       c.image_url,
       c.is_active,
       c.created_at
     ORDER BY c.created_at DESC`
  );

  return result.rows;
};

// -----------------------------------------
// GET CATEGORY BY ID
// -----------------------------------------
export const getCategoryById = async (
  categoryId
) => {
  const result = await pool.query(
    `SELECT
       id,
       name,
       slug,
       description,
       image_url,
       created_at
     FROM categories
     WHERE id = $1`,
    [categoryId]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "Category not found",
      404
    );
  }

  return result.rows[0];
};

// -----------------------------------------
// CREATE CATEGORY
// -----------------------------------------
export const createCategory = async ({
  name,
  slug,
  description,
  image_url,
}) => {
  const existingCategory =
    await pool.query(
      `SELECT id
       FROM categories
       WHERE slug = $1`,
      [slug]
    );

  if (existingCategory.rows.length > 0) {
    throw new AppError(
      "Category slug already exists",
      409
    );
  }

  const result = await pool.query(
    `INSERT INTO categories (
       name,
       slug,
       description,
       image_url
     )
     VALUES ($1, $2, $3, $4)
     RETURNING
       id,
       name,
       slug,
       description,
       image_url,
       created_at`,
    [
      name,
      slug,
      description || null,
      image_url || null,
    ]
  );

  return result.rows[0];
};


// -----------------------------------------
// UPDATE CATEGORY
// -----------------------------------------
// -----------------------------------------
// UPDATE CATEGORY
// -----------------------------------------
export const updateCategory = async (
  categoryId,
  {
    name,
    slug,
    description,
    image_url,
    status,
  }
) => {
  // Check category exists
  const existingCategory =
    await pool.query(
      `SELECT id
       FROM categories
       WHERE id = $1`,
      [categoryId]
    );

  if (
    existingCategory.rows.length === 0
  ) {
    throw new AppError(
      "Category not found",
      404
    );
  }

  // Status-only update
  if (
    status === "active" ||
    status === "inactive"
  ) {
    const result = await pool.query(
      `UPDATE categories
       SET is_active = $1
       WHERE id = $2
       RETURNING
         id,
         name,
         slug,
         description,
         image_url,
         is_active,
         created_at`,
      [
        status === "active",
        categoryId,
      ]
    );

    return result.rows[0];
  }

  // Normal category update
  // Check whether another category
  // already uses this slug
  const existingSlug =
    await pool.query(
      `SELECT id
       FROM categories
       WHERE slug = $1
       AND id != $2`,
      [slug, categoryId]
    );

  if (existingSlug.rows.length > 0) {
    throw new AppError(
      "Category slug already exists",
      409
    );
  }

  const result = await pool.query(
    `UPDATE categories
     SET
       name = $1,
       slug = $2,
       description = $3,
       image_url = $4
     WHERE id = $5
     RETURNING
       id,
       name,
       slug,
       description,
       image_url,
       is_active,
       created_at`,
    [
      name,
      slug,
      description || null,
      image_url || null,
      categoryId,
    ]
  );

  return result.rows[0];
};

// -----------------------------------------
// UPDATE CATEGORY IMAGE
// -----------------------------------------
export const updateCategoryImage = async (
  categoryId,
  imageUrl
) => {
  const existingCategory =
    await pool.query(
      `SELECT id
       FROM categories
       WHERE id = $1`,
      [categoryId]
    );

  if (
    existingCategory.rows.length === 0
  ) {
    throw new AppError(
      "Category not found",
      404
    );
  }

  const result = await pool.query(
    `UPDATE categories
     SET image_url = $1
     WHERE id = $2
     RETURNING
       id,
       name,
       slug,
       description,
       image_url,
       is_active,
       created_at`,
    [
      imageUrl,
      categoryId,
    ]
  );

  return result.rows[0];
};


// -----------------------------------------
// DELETE CATEGORY
// -----------------------------------------
export const deleteCategory = async (
  categoryId
) => {
  // Check category exists
  const existingCategory =
    await pool.query(
      `SELECT id
       FROM categories
       WHERE id = $1`,
      [categoryId]
    );

  if (
    existingCategory.rows.length === 0
  ) {
    throw new AppError(
      "Category not found",
      404
    );
  }

  const result = await pool.query(
    `DELETE FROM categories
     WHERE id = $1
     RETURNING
       id,
       name,
       slug`,
    [categoryId]
  );

  return result.rows[0];
};