import jwt from "jsonwebtoken";
import User from "../../models/client/User.model.js";

export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Thiếu token xác thực" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Thiếu token" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token đã hết hạn", success: false, expire: true });
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ", success: false, expire: false });
    }

    console.error("Lỗi khi xác minh JWT trong authMiddleware", error);
    return res.status(500).json({ message: "Lỗi hệ thống", success: false });
  }
};
