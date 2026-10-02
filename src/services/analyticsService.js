import pool from "../config/db.js";
import AppError from "../utils/Apperror.js";

export const createAnalyticsEvent = async ({
  userId = null,
  eventName,
  productId = null,
  metadata = null,
}) => {
  // Validate event name
  if (typeof eventName !== "string") {
    throw new AppError("Event name must be a string", 400);
  }

  const trimmedEventName = eventName.trim();

  if (!trimmedEventName) {
    throw new AppError("Event name is required", 400);
  }

  if (trimmedEventName.length > 100) {
    throw new AppError(
      "Event name must be 100 characters or less",
      400
    );
  }

  // Validate product ID exists
  // Validate user ID exists
if (userId !== null) {
  const userResult = await pool.query(
    "SELECT id FROM users WHERE id = $1",
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError("User not found", 404);
  }
}
  

  // Create analytics event
  const result = await pool.query(
    `INSERT INTO analytics_events (
       user_id,
       event_name,
       product_id,
       metadata
     )
     VALUES ($1, $2, $3, $4)
     RETURNING
       id,
       user_id,
       event_name,
       product_id,
       metadata,
       created_at`,
    [
      userId,
      trimmedEventName,
      productId,
      metadata,
    ]
  );

  return result.rows[0];
};

export const getAnalyticsEvents = async () => {
  const result = await pool.query(
    `SELECT
       ae.id,
       ae.user_id,
       u.name AS user_name,
       ae.event_name,
       ae.product_id,
       p.name AS product_name,
       ae.metadata,
       ae.created_at
     FROM analytics_events ae
     LEFT JOIN users u
       ON ae.user_id = u.id
     LEFT JOIN products p
       ON ae.product_id = p.id
     ORDER BY ae.created_at DESC`
  );

  return result.rows;
};

export const getAnalyticsSummary = async () => {
  const result = await pool.query(
    `SELECT
       COUNT(*) AS total_events,
       COUNT(*) FILTER (WHERE user_id IS NULL) AS guest_events,
       COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS user_events
     FROM analytics_events`
  );

  return result.rows[0];
};

export const getAnalyticsDashboardSummary = async (days = null) => {
  const result = await pool.query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM products
        WHERE is_active = TRUE
      ) AS total_products,

      (
        SELECT COUNT(*)
        FROM users
        WHERE role = 'customer'
      ) AS total_customers,

      (
        SELECT COUNT(*)
        FROM orders
        WHERE status <> 'cancelled'
          AND (
            $1::integer IS NULL
            OR created_at >= CURRENT_DATE - ($1::integer - 1)
          )
      ) AS total_orders,

      (
        SELECT COUNT(*)
        FROM analytics_events
        WHERE event_name = 'product_view'
          AND (
            $1::integer IS NULL
            OR created_at >= CURRENT_DATE - ($1::integer - 1)
          )
      ) AS product_views,

      (
        SELECT COUNT(*)
        FROM analytics_events
        WHERE event_name = 'wishlist_add'
          AND (
            $1::integer IS NULL
            OR created_at >= CURRENT_DATE - ($1::integer - 1)
          )
      ) AS wishlist_activity,

      (
        SELECT COUNT(*)
        FROM analytics_events
        WHERE event_name = 'cart_add'
          AND (
            $1::integer IS NULL
            OR created_at >= CURRENT_DATE - ($1::integer - 1)
          )
      ) AS cart_activity,

      (
        SELECT COUNT(*)
        FROM analytics_events
        WHERE event_name = 'whatsapp_order_clicked'
          AND (
            $1::integer IS NULL
            OR created_at >= CURRENT_DATE - ($1::integer - 1)
          )
      ) AS whatsapp_order_requests,

      (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM orders
        WHERE status <> 'cancelled'
          AND payment_status = 'paid'
          AND (
            $1::integer IS NULL
            OR created_at >= CURRENT_DATE - ($1::integer - 1)
          )
      ) AS paid_revenue,

      (
        SELECT COUNT(*)
        FROM orders
        WHERE status = 'delivered'
          AND (
            $1::integer IS NULL
            OR created_at >= CURRENT_DATE - ($1::integer - 1)
          )
      ) AS delivered_orders
  `,
  [days]);

  return result.rows[0];
};


export const getDailyRevenue = async () => {
  const result = await pool.query(`
    SELECT
      DATE(created_at) AS date,
      COALESCE(SUM(total_amount), 0) AS revenue
    FROM orders
    WHERE status <> 'cancelled'
      AND payment_status = 'paid'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `);

  return result.rows;
};

export const getProductAnalytics = async (days = null) => {
  const result = await pool.query(`
    SELECT
      p.id,
      p.name,
      p.price,

      COUNT(*) FILTER (
        WHERE ae.event_name = 'product_view'
      ) AS views,

      COUNT(*) FILTER (
        WHERE ae.event_name = 'wishlist_add'
      ) AS wishlist_adds,

      COUNT(*) FILTER (
        WHERE ae.event_name = 'cart_add'
      ) AS cart_adds,

      COUNT(*) FILTER (
        WHERE ae.event_name = 'whatsapp_order_clicked'
      ) AS whatsapp_clicks,

      COUNT(DISTINCT oi.order_id) FILTER (
        WHERE o.status <> 'cancelled'
      ) AS orders

    FROM products p

    LEFT JOIN analytics_events ae
  ON ae.product_id = p.id
  AND (
    $1::integer IS NULL
    OR ae.created_at >= CURRENT_DATE - ($1::integer - 1)
  )

    LEFT JOIN order_items oi
      ON oi.product_id = p.id

   LEFT JOIN orders o
  ON o.id = oi.order_id
  AND (
    $1 IS NULL
    OR o.created_at >= CURRENT_DATE - ($1::integer - 1)
  )
    GROUP BY
      p.id,
      p.name,
      p.price

        ORDER BY views DESC, p.name ASC
  `,
  [days]
);

  return result.rows;
};

export const getDailyAnalytics = async () => {
  const result = await pool.query(`
    SELECT
      DATE(created_at) AS date,

      COUNT(*) FILTER (
        WHERE event_name = 'product_view'
      ) AS product_views,

      COUNT(*) FILTER (
        WHERE event_name = 'wishlist_add'
      ) AS wishlist_adds,

      COUNT(*) FILTER (
        WHERE event_name = 'cart_add'
      ) AS cart_adds,

      COUNT(*) FILTER (
        WHERE event_name = 'whatsapp_order_clicked'
      ) AS whatsapp_clicks

      

    FROM analytics_events

    GROUP BY DATE(created_at)

    ORDER BY DATE(created_at) ASC
  `);

  return result.rows;
};



export const getCategoryPerformance = async () => {
  const result = await pool.query(`
    SELECT
      c.id,
      c.name,

      COALESCE(
        SUM(
          CASE
            WHEN o.status <> 'cancelled'
            THEN oi.quantity * oi.price
            ELSE 0
          END
        ),
        0
      ) AS value,

      COUNT(ae.id) FILTER (
        WHERE ae.event_name = 'product_view'
      ) AS views

    FROM categories c

    LEFT JOIN products p
      ON p.category_id = c.id

    LEFT JOIN analytics_events ae
      ON ae.product_id = p.id

    LEFT JOIN order_items oi
      ON oi.product_id = p.id

    LEFT JOIN orders o
      ON o.id = oi.order_id

    GROUP BY
      c.id,
      c.name

    ORDER BY value DESC, c.name ASC
  `);

  return result.rows;
};