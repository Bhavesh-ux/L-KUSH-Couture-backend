import pool from "../config/db.js";
import AppError from "../utils/Apperror.js";

export const addToWishlist = async (userId, productId) => {
  const productResult = await pool.query(
    `SELECT id, name, is_active
     FROM products
     WHERE id = $1`,
    [productId]
  );

  if (productResult.rows.length === 0) {
    throw new AppError("Product not found", 404);
  }

  const product = productResult.rows[0];

  if (!product.is_active) {
    throw new AppError("Product is not available", 400);
  }

  const result = await pool.query(
    `INSERT INTO wishlist (
       user_id,
       product_id
     )
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id)
     DO NOTHING
     RETURNING
       id,
       user_id,
       product_id,
       created_at`,
    [userId, productId]
  );

  if (result.rows.length === 0) {
    throw new AppError("Product already exists in wishlist", 409);
  }

  return result.rows[0];
};

export const getMyWishlist = async (userId) => {
  const result = await pool.query(
    `SELECT
       w.id,
       w.user_id,
       w.product_id,
       p.name,
       p.slug,
       p.description,
       p.price,
       p.stock,
       p.is_featured,
       p.is_active,
       w.created_at
     FROM wishlist w
     INNER JOIN products p
       ON w.product_id = p.id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  );

  return result.rows;
};

export const removeFromWishlist = async (userId, productId) => {
  const result = await pool.query(
    `DELETE FROM wishlist
     WHERE user_id = $1
       AND product_id = $2
     RETURNING id, user_id, product_id`,
    [userId, productId]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "Product not found in your wishlist",
      404
    );
  }

  return result.rows[0];
};