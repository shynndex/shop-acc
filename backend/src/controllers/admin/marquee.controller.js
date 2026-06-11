import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { pushMarqueeEvent } from "../../services/marquee.service.js";

/**
 * POST /api/admin/marquee
 * Push a manual marquee notification (admin only)
 * Body: { message: string }
 */
export const pushManualMarquee = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    throw new AppError("Vui lòng nhập nội dung thông báo", 400);
  }

  const event = pushMarqueeEvent("manual", req.admin?.username || "Admin", {
    message: message.trim(),
  });

  res.json({
    success: true,
    message: "Đã gửi thông báo",
    data: { event },
  });
});
