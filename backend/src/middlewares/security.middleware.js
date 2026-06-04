/**
 * Security Middleware
 *
 * Centralized HTTP security headers, CSP, and HPP protection.
 * Applied globally in server.js — must be registered BEFORE any route.
 *
 * Order in server.js:
 *   1. Helmet (security headers + CSP)
 *   2. HPP (parameter pollution)
 *   3. CORS
 *   4. JSON body parser
 *   5. Cookie parser
 *   6. Sanitize
 */

import helmet from "helmet";
import hpp from "hpp";

// ── Environment helpers ─────────────────────────────────────────
const isDev = process.env.NODE_ENV !== "production";
const cloudinaryDomain = process.env.CLOUDINARY_CLOUD_NAME
  ? `${process.env.CLOUDINARY_CLOUD_NAME}.cloudinary.com`
  : "*.cloudinary.com";

// ── Helmet configuration ────────────────────────────────────────

/**
 * Build Helmet config with environment-aware CSP.
 *
 * Production CSP is strict:
 *   ✓ Self-hosted scripts/styles
 *   ✓ Cloudinary images
 *   ✓ Google Fonts (optional — remove if not used)
 *   ✓ WebSocket / SSE connections
 *
 * Development allows Vite HMR (eval, ws).
 */
function getHelmetConfig() {
  // Base directives shared by dev + prod
  const baseDirectives = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"], // Clickjacking protection
    "upgrade-insecure-requests": [], // Auto-upgrade HTTP → HTTPS in prod
  };

  if (isDev) {
    // ── Development: Relax CSP for Vite HMR ────────────────────
    return {
      contentSecurityPolicy: {
        directives: {
          ...baseDirectives,
          // Vite needs 'unsafe-inline' for dev CSS injection + 'unsafe-eval' for HMR
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          // Vite WebSocket HMR
          "connect-src": ["'self'", "ws://localhost:*", "http://localhost:*"],
          // Allow images (inline data URIs for Vite)
          "img-src": ["'self'", "data:", "blob:"],
          // Allow fonts from same origin
          "font-src": ["'self'", "data:"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    };
  }

  // ── Production: Strict CSP ────────────────────────────────────
  return {
    contentSecurityPolicy: {
      directives: {
        ...baseDirectives,
        "script-src": ["'self'"],
        "style-src": [
          "'self'",
          "'unsafe-inline'", // shadcn/ui + Tailwind use inline styles
        ],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          `https://${cloudinaryDomain}`, // Cloudinary images
          "https://res.cloudinary.com", // Cloudinary CDN
          "https://*.gravatar.com", // Avatar fallbacks
        ],
        "connect-src": [
          "'self'",
          // API calls — same origin
          // SSE endpoint
          // Cloudinary upload API (if direct upload from browser)
          `https://${cloudinaryDomain}`,
          "https://api.cloudinary.com",
        ],
        "font-src": [
          "'self'",
          "data:", // For inline font loading
          "https://fonts.gstatic.com", // Google Fonts (if used)
        ],
        // No worker-src restriction (allow same-origin)
        "worker-src": ["'self'", "blob:"],
        // Disable object/embed for old plugin-based attacks
        "object-src": ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  };
}

// ── Exported middleware factory ──────────────────────────────────

/**
 * Apply all security middleware to an Express app.
 *
 * Usage: import { applySecurity } from "./middlewares/security.middleware.js";
 *        applySecurity(app);
 *
 * @param {import("express").Application} app
 */
export function applySecurity(app) {
  // 1. Helmet — security headers + CSP
  app.use(helmet(getHelmetConfig()));

  // 2. HPP — HTTP parameter pollution protection
  app.use(
    hpp({
      // Whitelist: query params that ARE allowed to be arrays
      whitelist: ["game", "type", "status"],
    }),
  );

  // 3. Remove default Express header that leaks server info
  app.disable("x-powered-by");

  // 4. Additional custom security headers
  app.use((_req, res, next) => {
    // Prevent MIME type sniffing (belt-and-suspenders with Helmet's nosniff)
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Block cross-domain embedding (Adobe Flash/PDF)
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

    // Referrer policy — strict
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy — restrict browser features
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    );

    // ── Strict-Transport-Security (HSTS) — production only ────────────
    // Tells browsers to always connect via HTTPS for 1 year, including subdomains.
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
    }

    // ── Cross-Origin-Embedder-Policy ─────────────────────────────────
    // Skip in development to allow cross-origin Vite dev server.
    // Note: isDev is evaluated at module load (before dotenv), so check at request time.
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    }

    next();
  });
}
