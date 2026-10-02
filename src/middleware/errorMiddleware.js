// src/middleware/errorMiddleware.js

const errorMiddleware = (err, req, res, next) => {
 console.error("ERROR:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Image file size must be 5MB or less",
    });
  }

  if (err.message === "Only image files are allowed") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed",
    });
  }

  const statusCode = err.statusCode || 500;

  const message = err.isOperational
    ? err.message
    : "Something went wrong on the server";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;