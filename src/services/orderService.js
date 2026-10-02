import pool from "../config/db.js";
import AppError from "../utils/Apperror.js";
import { createNotification } from "../services/notificationService.js";

export const createOrder = async ({
  userId,
  items,
  shippingName,
  shippingPhone,
  shippingAddress,
  city,
  state,
  pincode,
}) => {
  if (!items || items.length === 0) {
    throw new AppError("Order must contain at least one item", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
     const { productId, quantity, size, color } = item;

      if (!productId || !quantity || quantity <= 0) {
        throw new AppError("Invalid product or quantity", 400);
      }

      const productResult = await client.query(
        `SELECT id, name, price, stock, is_active
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        throw new AppError(`Product ${productId} not found`, 404);
      }

      const product = productResult.rows[0];

      if (!product.is_active) {
        throw new AppError(
          `Product "${product.name}" is not available`,
          400
        );
      }

      if (product.stock < quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}"`,
          400
        );
      }

      const price = Number(product.price);
      const subtotal = price * quantity;

      totalAmount += subtotal;

     orderItems.push({
  productId: product.id,
  productName: product.name,
  quantity,
  price,
  subtotal,
  size: size || null,
  color: color || null,
});
    }

    const orderNumber = `LK-${Date.now()}`;

    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id,
        order_number,
        total_amount,
        shipping_name,
        shipping_phone,
        shipping_address,
        city,
        state,
        pincode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        user_id,
        order_number,
        total_amount,
        status,
        payment_status,
        shipping_name,
        shipping_phone,
        shipping_address,
        city,
        state,
        pincode,
        created_at`,
      [
        userId,
        orderNumber,
        totalAmount,
        shippingName,
        shippingPhone,
        shippingAddress,
        city,
        state,
        pincode,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (
  order_id,
  product_id,
  quantity,
  price,
  subtotal,
  size,
  color
)
VALUES ($1, $2, $3, $4, $5, $6, $7)`,
       [
  order.id,
  item.productId,
  item.quantity,
  item.price,
  item.subtotal,
  item.size,
  item.color,
]
      );

      await client.query(
        `UPDATE products
         SET stock = stock - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [item.quantity, item.productId]
      );
    }

    // Create notification inside the same transaction
    await client.query(
  `INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    order_id
  )
  VALUES ($1, $2, $3, $4, $5)`,
  [
    userId,
    "Order Placed",
    `Your order ${order.order_number} has been placed successfully.`,
    "order",
    order.id,
  ]
);

    await client.query("COMMIT");

    return {
      ...order,
      items: orderItems,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getMyOrders = async (userId) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.order_number,
       o.total_amount,
       o.status,
       o.payment_status,
       o.shipping_name,
       o.shipping_phone,
       o.shipping_address,
       o.city,
       o.state,
       o.pincode,
       o.created_at,
       COALESCE(
         json_agg(
           json_build_object(
             'id', oi.id,
             'product_id', oi.product_id,
             'product_name', p.name,
             'image', pi.image_url,
             'quantity', oi.quantity,
             'price', oi.price,
             'subtotal', oi.subtotal,
             'size', oi.size,
             'color', oi.color
           )
           ORDER BY oi.id
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM orders o
     LEFT JOIN order_items oi
       ON o.id = oi.order_id
     LEFT JOIN products p
       ON oi.product_id = p.id
     LEFT JOIN LATERAL (
       SELECT image_url
       FROM product_images
       WHERE product_id = p.id
       ORDER BY is_primary DESC, id ASC
       LIMIT 1
     ) pi ON true
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getMyOrderById = async (orderId, userId) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.order_number,
       o.total_amount,
       o.status,
       o.payment_status,
       o.shipping_name,
       o.shipping_phone,
       o.shipping_address,
       o.city,
       o.state,
       o.pincode,
       o.created_at,
       COALESCE(
         json_agg(
           json_build_object(
  'id', oi.id,
  'product_id', oi.product_id,
  'product_name', p.name,
  'quantity', oi.quantity,
  'price', oi.price,
  'subtotal', oi.subtotal,
  'size', oi.size,
  'color', oi.color
)
           ORDER BY oi.id
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM orders o
     LEFT JOIN order_items oi
       ON o.id = oi.order_id
     LEFT JOIN products p
       ON oi.product_id = p.id
     WHERE o.id = $1
       AND o.user_id = $2
     GROUP BY o.id`,
    [orderId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError("Order not found", 404);
  }

  return result.rows[0];
};

export const getAllOrders = async () => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.user_id,
       u.name AS customer_name,
       u.email AS customer_email,
       o.order_number,
       o.total_amount,
       o.status,
       o.payment_status,
       o.shipping_name,
       o.shipping_phone,
       o.shipping_address,
       o.city,
       o.state,
       o.pincode,
       o.created_at,

       COALESCE(
         json_agg(
           json_build_object(
             'id', oi.id,
             'product_id', oi.product_id,
             'product_name', p.name,
             'image', pi.image_url,
             'quantity', oi.quantity,
             'price', oi.price,
             'subtotal', oi.subtotal,
             'size', oi.size,
             'color', oi.color
           )
           ORDER BY oi.id
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'
       ) AS items

     FROM orders o

     LEFT JOIN users u
       ON o.user_id = u.id

     LEFT JOIN order_items oi
       ON o.id = oi.order_id

     LEFT JOIN products p
       ON oi.product_id = p.id

     LEFT JOIN LATERAL (
       SELECT image_url
       FROM product_images
       WHERE product_id = p.id
       ORDER BY is_primary DESC, id ASC
       LIMIT 1
     ) pi ON true

     GROUP BY o.id, u.name, u.email

     ORDER BY o.created_at DESC`
  );

  return result.rows;
};

export const getAdminOrderById = async (orderId) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.user_id,
       u.name AS customer_name,
       u.email AS customer_email,
       o.order_number,
       o.total_amount,
       o.status,
       o.payment_status,
       o.shipping_name,
       o.shipping_phone,
       o.shipping_address,
       o.city,
       o.state,
       o.pincode,
       o.created_at,
       COALESCE(
         json_agg(
           json_build_object(
  'id', oi.id,
  'product_id', oi.product_id,
  'product_name', p.name,
  'quantity', oi.quantity,
  'price', oi.price,
  'subtotal', oi.subtotal,
  'size', oi.size,
  'color', oi.color
)
           ORDER BY oi.id
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM orders o
     LEFT JOIN users u
       ON o.user_id = u.id
     LEFT JOIN order_items oi
       ON o.id = oi.order_id
     LEFT JOIN products p
       ON oi.product_id = p.id
     WHERE o.id = $1
     GROUP BY o.id, u.name, u.email`,
    [orderId]
  );

  if (result.rows.length === 0) {
    throw new AppError("Order not found", 404);
  }

  return result.rows[0];
};

export const updateOrderStatus = async (orderId, status) => {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid order status", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, status, user_id, order_number
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError("Order not found", 404);
    }

    const currentOrder = orderResult.rows[0];
    const currentStatus = currentOrder.status;

    if (currentStatus === "cancelled" && status === "cancelled") {
      throw new AppError("Order is already cancelled", 400);
    }

    if (
      status === "cancelled" &&
      !["pending", "confirmed"].includes(currentStatus)
    ) {
      throw new AppError(
        `Order cannot be cancelled from "${currentStatus}" status`,
        400
      );
    }

    if (
      status === "cancelled" &&
      ["pending", "confirmed"].includes(currentStatus)
    ) {
      const itemsResult = await client.query(
        `SELECT product_id, quantity
         FROM order_items
         WHERE order_id = $1`,
        [orderId]
      );

      for (const item of itemsResult.rows) {
        if (item.product_id) {
          await client.query(
            `UPDATE products
             SET stock = stock + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }
    }

    const result = await client.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING
         id,
         user_id,
         order_number,
         total_amount,
         status,
         payment_status,
         shipping_name,
         shipping_phone,
         shipping_address,
         city,
         state,
         pincode,
         created_at`,
      [status, orderId]
    );

    // Create notification for the customer when status changes
    if (currentOrder.user_id) {
      let title = "Order Update";
      let message = `Your order ${currentOrder.order_number} status has been updated to ${status}.`;

      if (status === "cancelled") {
        title = "Order Cancelled";
        message = `Your order ${currentOrder.order_number} has been cancelled.`;
      } else if (status === "confirmed") {
        title = "Order Confirmed";
        message = `Your order ${currentOrder.order_number} has been confirmed.`;
      } else if (status === "processing") {
        title = "Order Processing";
        message = `Your order ${currentOrder.order_number} is now being processed.`;
      } else if (status === "shipped") {
        title = "Order Shipped";
        message = `Your order ${currentOrder.order_number} has been shipped.`;
      } else if (status === "delivered") {
        title = "Order Delivered";
        message = `Your order ${currentOrder.order_number} has been delivered.`;
      }

      await client.query(
  `INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    order_id
  )
  VALUES ($1, $2, $3, $4, $5)`,
  [
    currentOrder.user_id,
    title,
    message,
    "order",
    currentOrder.id,
  ]
);
    }

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updatePaymentStatus = async (
  orderId,
  paymentStatus
) => {
  const allowedPaymentStatuses = [
    "pending",
    "paid",
    "failed",
    "refunded",
  ];

  if (!allowedPaymentStatuses.includes(paymentStatus)) {
    throw new AppError("Invalid payment status", 400);
  }

  const result = await pool.query(
    `UPDATE orders
     SET payment_status = $1
     WHERE id = $2
     RETURNING
       id,
       user_id,
       order_number,
       total_amount,
       status,
       payment_status,
       shipping_name,
       shipping_phone,
       shipping_address,
       city,
       state,
       pincode,
       created_at`,
    [paymentStatus, orderId]
  );

  if (result.rows.length === 0) {
    throw new AppError("Order not found", 404);
  }

  return result.rows[0];
};

export const cancelMyOrder = async (orderId, userId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, status, order_number
       FROM orders
       WHERE id = $1
         AND user_id = $2
       FOR UPDATE`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError("Order not found", 404);
    }

    const currentOrder = orderResult.rows[0];
    const currentStatus = currentOrder.status;

    if (currentStatus === "cancelled") {
      throw new AppError("Order is already cancelled", 400);
    }

    if (!["pending", "confirmed"].includes(currentStatus)) {
      throw new AppError(
        `Order cannot be cancelled from "${currentStatus}" status`,
        400
      );
    }

    const itemsResult = await client.query(
      `SELECT product_id, quantity
       FROM order_items
       WHERE order_id = $1`,
      [orderId]
    );

    for (const item of itemsResult.rows) {
      if (item.product_id) {
        await client.query(
          `UPDATE products
           SET stock = stock + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    const result = await client.query(
      `UPDATE orders
       SET status = 'cancelled'
       WHERE id = $1
         AND user_id = $2
       RETURNING
         id,
         user_id,
         order_number,
         total_amount,
         status,
         payment_status,
         shipping_name,
         shipping_phone,
         shipping_address,
         city,
         state,
         pincode,
         created_at`,
      [orderId, userId]
    );

    await client.query(
  `INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    order_id
  )
  VALUES ($1, $2, $3, $4, $5)`,
  [
    userId,
    "Order Cancelled",
    `Your order ${currentOrder.order_number} has been cancelled.`,
    "order",
    currentOrder.id,
  ]
);

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};