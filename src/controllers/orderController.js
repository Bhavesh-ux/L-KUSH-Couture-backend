import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelMyOrder,
} from "../services/orderService.js";


export const createOrderController = async (req, res, next) => {
  try {
    const {
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      city,
      state,
      pincode,
    } = req.body;

    const order = await createOrder({
      userId: req.user.id,
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      city,
      state,
      pincode,
    });

    

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
export const getMyOrdersController = async (req, res, next) => {
  try {
    const orders = await getMyOrders(req.user.id);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};



export const getMyOrderByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await getMyOrderById(
      id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrdersController = async (req, res, next) => {
  try {
    const orders = await getAllOrders();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrderByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await getAdminOrderById(id);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};


export const updateOrderStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await updateOrderStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const order = await updatePaymentStatus(id, paymentStatus);

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMyOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await cancelMyOrder(
      id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};