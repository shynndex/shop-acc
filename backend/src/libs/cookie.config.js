/**
 * Options for the access token cookie (24h).
 */
export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000, // 24 giờ
  path: "/api/admin",
});

/**
 * Options for the refresh token cookie (7 days, rotation-based).
 *
 * - Longer-lived than the access token
 * - httpOnly: prevents XSS theft
 * - secure in production: only sent over HTTPS
 * - sameSite='strict' for refresh: only sent for same-site requests
 *   (this means the refresh endpoint must be same-site)
 */
export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  path: "/api/admin/auth/refresh", // Only sent to the refresh endpoint
});
