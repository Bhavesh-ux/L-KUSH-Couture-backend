import {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
} from "../services/wishlistService.js";

export const addToWishlistController = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const wishlistItem = await addToWishlist(
      req.user.id,
      productId
    );

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      data: wishlistItem,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyWishlistController = async (req, res, next) => {
  try {
    const wishlist = await getMyWishlist(req.user.id);

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlistController = async (
  req,
  res,
  next
) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await removeFromWishlist(
      req.user.id,
      productId
    );

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: wishlistItem,
    });
  } catch (error) {
    next(error);
  }
};