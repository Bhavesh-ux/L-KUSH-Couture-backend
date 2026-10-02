import pool from "../config/db.js";

export const getDashboardOverview = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total_orders,

      COALESCE(
        SUM(total_amount) FILTER (
          WHERE payment_status = 'paid'
        ),
        0
      ) AS total_revenue,

      COUNT(*) FILTER (
        WHERE status = 'pending'
      ) AS pending_orders,

      COUNT(*) FILTER (
        WHERE status = 'confirmed'
      ) AS confirmed_orders,

      COUNT(*) FILTER (
        WHERE status = 'processing'
      ) AS processing_orders,

      COUNT(*) FILTER (
        WHERE status = 'shipped'
      ) AS shipped_orders,

      COUNT(*) FILTER (
        WHERE status = 'delivered'
      ) AS delivered_orders,

      COUNT(*) FILTER (
        WHERE status = 'cancelled'
      ) AS cancelled_orders,

      COUNT(*) FILTER (
        WHERE payment_status = 'paid'
      ) AS paid_orders,

      COUNT(*) FILTER (
        WHERE payment_status = 'pending'
      ) AS pending_payments

    FROM orders
  `);

  return result.rows[0];
};

export const getRecentOrders = async () => {
  const result = await pool.query(`
    SELECT
      o.id,
      o.order_number,
      o.total_amount,
      o.status,
      o.payment_status,
      o.shipping_name,
      o.city,
      o.state,
      o.created_at,
      u.name AS customer_name,
      u.email AS customer_email
    FROM orders o
    LEFT JOIN users u
      ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);

  return result.rows;
};

export const getProductStats = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total_products,

      COUNT(*) FILTER (
        WHERE is_active = TRUE
      ) AS active_products,

      COUNT(*) FILTER (
        WHERE is_active = FALSE
      ) AS inactive_products,

      COUNT(*) FILTER (
        WHERE is_featured = TRUE
      ) AS featured_products,

      COUNT(*) FILTER (
        WHERE stock = 0
      ) AS out_of_stock_products

    FROM products
  `);

  return result.rows[0];
};

export const getUserStats = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total_users,

      COUNT(*) FILTER (
        WHERE role = 'customer'
      ) AS total_customers,

      COUNT(*) FILTER (
        WHERE role = 'admin'
      ) AS total_admins

    FROM users
  `);

  return result.rows[0];
};

export const getSalesSummary = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE payment_status = 'paid'
      ) AS paid_orders,

      COALESCE(
        SUM(total_amount) FILTER (
          WHERE payment_status = 'paid'
        ),
        0
      ) AS total_revenue,

      COALESCE(
        AVG(total_amount) FILTER (
          WHERE payment_status = 'paid'
        ),
        0
      ) AS average_order_value,

      COUNT(*) FILTER (
        WHERE status = 'delivered'
      ) AS delivered_orders

    FROM orders
  `);

  return result.rows[0];
};