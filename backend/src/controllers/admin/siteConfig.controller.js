import SiteConfig from "../../models/admin/SiteConfig.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";

/**
 * GET /api/admin/site-config
 * Get the full site configuration (admin)
 */
export const getSiteConfig = asyncHandler(async (req, res) => {
  const config = await SiteConfig.getConfig();
  res.json({ success: true, data: config });
});

/**
 * PUT /api/admin/site-config
 * Update site config (partial update with field-level $set)
 */
export const updateSiteConfig = asyncHandler(async (req, res) => {
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    throw new AppError("Không có dữ liệu cập nhật", 400);
  }

  // Build $set object for nested fields
  const $set = {};
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      for (const [subKey, subValue] of Object.entries(value)) {
        $set[`${key}.${subKey}`] = subValue;
      }
    } else {
      $set[key] = value;
    }
  }

  $set.lastUpdatedBy = req.admin._id;

  const config = await SiteConfig.findOneAndUpdate(
    {},
    { $set },
    { new: true, upsert: true }
  );

  res.json({
    success: true,
    message: "Cập nhật cấu hình thành công",
    data: config,
  });
});

/**
 * GET /api/ui/site-config
 * Public: get public site config (shop name, contact, theme, support)
 */
export const getPublicSiteConfig = asyncHandler(async (req, res) => {
  const config = await SiteConfig.getConfig();

  res.json({
    success: true,
    data: {
      shopName: config.shopName,
      logo: config.logo,
      description: config.description,
      contact: config.contact,
      support: config.support,
      theme: config.theme,
      topNotification: config.topNotification,
    },
  });
});

/**
 * GET /api/ui/contact-info
 * Public: get contact information only
 */
export const getPublicContactInfo = asyncHandler(async (req, res) => {
  const config = await SiteConfig.getConfig();
  res.json({ success: true, data: config.contact });
});

/**
 * GET /api/ui/theme
 * Public: get theme colors only
 */
export const getPublicTheme = asyncHandler(async (req, res) => {
  const config = await SiteConfig.getConfig();
  res.json({ success: true, data: config.theme });
});

/**
 * GET /api/ui/seo
 * Public: get SEO metadata only
 */
export const getPublicSeo = asyncHandler(async (req, res) => {
  const config = await SiteConfig.getConfig();
  res.json({ success: true, data: config.seo });
});
