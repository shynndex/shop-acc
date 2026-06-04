/**
 * Central Error Handling Middleware
 * Bắt tất cả lỗi từ controllers và trả về response thống nhất
 */

export class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  // Log lỗi ra console
  console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // AppError do mình throw (operational errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      details: messages,
    });
  }

  // Mongoose CastError (ObjectId invalid)
  if (err.name === "CastError") {
    console.error("[CastError]", err.message, "Path:", err.path, "Value:", err.value);
    return res.status(400).json({
      success: false,
      message: "ID không hợp lệ",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack, path: err.path, value: err.value }),
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} đã tồn tại trong hệ thống`,
    });
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token đã hết hạn",
      expire: true,
    });
  }

  // PayOS errors
  if (err.name === "PayOsError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Lỗi thanh toán",
    });
  }

  // Default: 500 Internal Server Error
  return res.status(500).json({
    success: false,
    message: "Lỗi hệ thống",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Async wrapper để tránh try-catch trong controllers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
