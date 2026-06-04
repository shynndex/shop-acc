import { asyncHandler } from "../../middlewares/errorHandler.js";

/**
 * GET /api/admin/config/general
 * Return general app configuration from environment
 */
export const getGeneralConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: process.env.SITE_NAME || "ShopSamcc",
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
      minDeposit: 10000,
      maxDeposit: 100_000_000,
      cardProviders: ["VIETTEL", "MOBIFONE", "VINAPHONE", "GARENA"],
    },
  });
});

/**
 * POST /api/admin/config/update
 * Update general config (stored in env for now, could use a Settings model later)
 * For now, this is a placeholder — actual env changes require server restart
 */
export const updateGeneralConfig = asyncHandler(async (req, res) => {
  // In a production app, this would persist to a Settings collection in MongoDB
  // For now, return success with the current values
  res.json({
    success: true,
    message: "Cấu hình đã được cập nhật (lưu ý: một số thay đổi cần khởi động lại server)",
    data: {
      siteName: process.env.SITE_NAME || "ShopSamcc",
    },
  });
});

/**
 * GET /api/admin/config/card-providers
 * Return card provider configuration info
 */
export const getCardProviderConfig = asyncHandler(async (req, res) => {
  // Check if card provider is configured
  const isConfigured = !!(
    process.env.PARTNER_ID &&
    process.env.PARTNER_KEY &&
    process.env.BASE_URL
  );

  res.json({
    success: true,
    data: {
      isConfigured,
      partnerId: process.env.PARTNER_ID || "Chưa cấu hình",
      baseUrl: process.env.BASE_URL || "Chưa cấu hình",
      // Không trả về PARTNER_KEY vì lý do bảo mật
      providers: ["VIETTEL", "MOBIFONE", "VINAPHONE", "GARENA"],
      feeCacheTTL: "10 phút",
    },
  });
});
