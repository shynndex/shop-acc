import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const protectedRoute = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Thiếu token" });
    }

    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Thiếu token" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token đã hết hạn", expire: true });
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ", expire: false });
    }

    console.error("Lỗi khi xác minh JWT trong authMiddleware", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
