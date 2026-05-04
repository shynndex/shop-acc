import { protectedRoute } from "../middlewares/auth.middleware.js";
import express from "express";
import { addSSEClient } from "../utils/sse.js";

const router = express.Router();

/**
 * Endpoint để frontend kết nối lắng nghe event
 * GET /api/sse/stream
 * Header: Authorization: Bearer <token>
 */

router.get("/stream", protectedRoute, (req, res) => {
  const userId = req.user.id.toString();

  console.log(`[SSE] New connection: ${userId}`);

  // Thêm client vào danh sách quản lý
  addSSEClient(userId, res, req);
});

export default router;
