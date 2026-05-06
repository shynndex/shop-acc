import { protectedRoute } from "../middlewares/client/auth.middleware.js";
import express from "express";
import { addSSEClient } from "../utils/sse.js";

const router = express.Router();

/**
 * Endpoint để frontend kết nối lắng nghe event
 * GET /api/sse/stream
 * Header: Authorization: Bearer <token>
 */

router.get(
  "/stream",
  (req, res, next) => {
    let token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Thiếu token" });
    }
  },
  protectedRoute,
  (req, res) => {
    const userId = req.user.id.toString();

    console.log(`[SSE] New connection: ${userId}`);

    // Thêm client vào danh sách quản lý
    addSSEClient(userId, res, req);
  },
);

export default router;
