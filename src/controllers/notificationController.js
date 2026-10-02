import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService.js";

export const getMyNotificationsController = async (
  req,
  res,
  next
) => {
  try {
    const notifications = await getMyNotifications(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsReadController = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const notification = await markNotificationAsRead(
      id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsReadController = async (
  req,
  res,
  next
) => {
  try {
    const result = await markAllNotificationsAsRead(
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};