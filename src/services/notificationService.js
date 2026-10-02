import pool from "../config/db.js";
import AppError from "../utils/Apperror.js";

export const createNotification = async ({
  userId,
  title,
  message,
  type = "general",
  orderId = null,
}) => {
  if (!userId || !title || !message) {
    throw new AppError(
      "User ID, title and message are required",
      400
    );
  }

  const result = await pool.query(
    `INSERT INTO notifications (
       user_id,
       title,
       message,
       type,
       order_id
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING
       id,
       user_id,
       title,
       message,
       type,
       is_read,
       created_at,
       order_id`,
    [
      userId,
      title,
      message,
      type,
      orderId,
    ]
  );

  return result.rows[0];
};

export const getMyNotifications = async (userId) => {
  const result = await pool.query(
    `SELECT
  id,
  user_id,
  title,
  message,
  type,
  is_read,
  created_at,
  order_id
FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

export const markNotificationAsRead = async (
  notificationId,
  userId
) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1
       AND user_id = $2
     RETURNING
       id,
       user_id,
       title,
       message,
       type,
       is_read,
       created_at,
       order_id`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "Notification not found",
      404
    );
  }

  return result.rows[0];
};

export const markAllNotificationsAsRead = async (userId) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1
       AND is_read = FALSE
     RETURNING id`,
    [userId]
  );

  return {
    updatedCount: result.rowCount,
  };
};