/**
 * Rate Limiter Configuration
 *
 * Applied to sensitive endpoints to prevent brute force / abuse.
 *
 * Tiers (from strictest to loosest):
 *   loginLimiter     – 5 req / 15 min   (brute force login)
 *   strictLimiter    – 5 req / 1 min     (giftcode validation, payment)
 *   moderateLimiter  – 10 req / 1 min    (sign-up, password change)
 *   adminLimiter     – 30 req / 1 min    (admin API endpoints)
 *   apiLimiter       – 100 req / 1 min   (baseline for all API routes)
 *   sseLimiter       – 5 req / 10 sec    (SSE connection throttle)
 */

import rateLimit from "express-rate-limit";

/**
 * Login brute-force limiter: 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
  },
});

/**
 * Strict limiter: 5 attempts per minute
 * Used for: giftcode validation, payment confirm
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút",
  },
});

/**
 * Moderate limiter: 10 attempts per minute
 * Used for: sign-up, resend verification
 */
export const moderateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút",
  },
});

/**
 * Admin route limiter: 30 requests per minute
 * Admin users should have higher limits but still bounded.
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu quản trị, vui lòng thử lại sau 1 phút",
  },
});

/**
 * SSE connection throttle: 5 requests per 10 seconds per IP
 * Prevents SSE endpoint abuse (reconnection storms).
 */
export const sseLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 giây
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Kết nối SSE quá thường xuyên, vui lòng đợi",
  },
});

/**
 * General API limiter: 100 requests per minute
 * Used for: all API routes as a baseline safety net.
 * Note: This is intentionally looser than the per-route limiters
 * because it catches all API traffic — route-specific limiters
 * provide the real protection.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
  },
});
