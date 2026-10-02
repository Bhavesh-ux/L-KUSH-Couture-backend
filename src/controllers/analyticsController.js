import {
  createAnalyticsEvent,
  getAnalyticsEvents,
  getAnalyticsSummary,
  getAnalyticsDashboardSummary,
  getProductAnalytics,
  getDailyAnalytics,
  getDailyRevenue,
  getCategoryPerformance,
} from '../services/analyticsService.js';;

export const createAnalyticsEventController = async (
  req,
  res,
  next
) => {
  try {
    const {
      eventName,
      productId,
      metadata,
    } = req.body;

    // Validate product ID
    if (
      productId !== undefined &&
      productId !== null &&
      productId !== ""
    ) {
      if (
        !Number.isInteger(Number(productId)) ||
        Number(productId) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Product ID must be a valid positive integer",
        });
      }
    }

    // Validate metadata
    if (
      metadata !== undefined &&
      metadata !== null &&
      typeof metadata !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message: "Metadata must be a valid JSON object",
      });
    }

    if (metadata !== null && metadata !== undefined) {
      if (Array.isArray(metadata)) {
        return res.status(400).json({
          success: false,
          message: "Metadata must be a JSON object, not an array",
        });
      }

      const metadataSize = JSON.stringify(metadata).length;

      if (metadataSize > 10000) {
        return res.status(400).json({
          success: false,
          message: "Metadata must be 10KB or less",
        });
      }
    }

    const event = await createAnalyticsEvent({
      userId: req.user?.id || null,
      eventName,
      productId:
        productId !== undefined &&
        productId !== null &&
        productId !== ""
          ? Number(productId)
          : null,
      metadata:
        metadata !== undefined && metadata !== null
          ? metadata
          : null,
    });

    res.status(201).json({
      success: true,
      message: "Analytics event created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsEventsController = async (
  req,
  res,
  next
) => {
  try {
    const events = await getAnalyticsEvents();

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsSummaryController = async (
  req,
  res,
  next
) => {
  try {
    const summary = await getAnalyticsSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
export const getAnalyticsDashboardSummaryController = async (
  req,
  res,
  next
) => {
  try {
    const days =
      req.query.days === undefined
        ? null
        : Number(req.query.days);

    const summary = await getAnalyticsDashboardSummary(days);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductAnalyticsController = async (
  req,
  res,
  next
) => {
  try {
    const days =
      req.query.days === undefined
        ? null
        : Number(req.query.days);

    const products = await getProductAnalytics(days);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyAnalyticsController = async (
  req,
  res,
  next
) => {
  try {
    const analytics = await getDailyAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};


export const getCategoryPerformanceController = async (
  req,
  res,
  next
) => {
  try {
    const categories = await getCategoryPerformance();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyRevenueController = async (req, res) => {
  try {
    const data = await getDailyRevenue();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get daily revenue error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily revenue'
    });
  }
};