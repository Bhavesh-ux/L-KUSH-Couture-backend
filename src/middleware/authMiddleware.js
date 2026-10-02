// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import AppError from "../utils/Apperror.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Header se token nikalna: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Not authorized, no token provided", 401);
    }

    // 2. Token verify karna
   const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET,
  {
    algorithms: ["HS256"],
  }
);

    // 3. User ko DB se dobara fetch karna (fresh data ke liye)
   const result = await pool.query(
  `SELECT id, name, email, phone, address, city, state, pincode, role
   FROM users
   WHERE id = $1`,
  [decoded.id]
);

    if (result.rows.length === 0) {
      throw new AppError("User no longer exists", 401);
    }

    // 4. req.user me attach karna, aage ke controllers use kar payenge
    req.user = result.rows[0];

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired token", 401));
    }
    next(error);
  }
};


export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};