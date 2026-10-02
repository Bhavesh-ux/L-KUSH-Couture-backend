import {
  getDashboardOverview,
  getRecentOrders,
  getProductStats,
  getUserStats,
  getSalesSummary,
} from "../services/dashboardService.js";

export const getDashboardOverviewController = async (
  req,
  res,
  next
) => {
  try {
    const overview = await getDashboardOverview();

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentOrdersController = async (
  req,
  res,
  next
) => {
  try {
    const orders = await getRecentOrders();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductStatsController = async (
  req,
  res,
  next
) => {
  try {
    const stats = await getProductStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStatsController = async (
  req,
  res,
  next
) => {
  try {
    const stats = await getUserStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesSummaryController = async (
  req,
  res,
  next
) => {
  try {
    const summary = await getSalesSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};