import express from "express";
import { connectDB } from "./libs/db.config.js";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";
import accountRoute from "./routes/account.route.js";
import sseRoute from "./routes/sse.route.js";
import userRoute from "./routes/user.route.js";
import uploadRoute from "./routes/admin/upload.route.js";
import depositRoutes from "./routes/admin/deposit.route.js";
import orderRoutes from "./routes/order.route.js";
import giftcodeRoute from "./routes/giftcode.route.js";
import adminGiftcodeRoute from "./routes/admin/giftcode.route.js";
import reconciliationRoute from "./routes/admin/reconciliation.route.js";
import userBalanceRoute from "./routes/admin/userBalance.route.js";
import reviewRoute from "./routes/review.route.js";
import adminReviewRoute from "./routes/admin/review.route.js";
import auditRoute from "./routes/admin/audit.route.js";
import adminOrderRoute from "./routes/admin/order.route.js";
import analyticsRoute from "./routes/admin/analytics.route.js";
import healthRoute from "./routes/health.route.js";
import paymentMonitorRoute from "./routes/admin/paymentMonitor.route.js";

import paymentRoute from "./routes/payment.route.js";
import adminAuthRoute from "./routes/admin/auth.route.js";
import adminAccountRoute from "./routes/admin/account.route.js";
import adminAdminRoute from "./routes/admin/admin.route.js";
import adminBankAccountRoute from "./routes/admin/bankAccount.route.js";
import adminConfigRoute from "./routes/admin/config.route.js";
import { adminRouter as adminUiRouter, publicRouter as publicUiRouter } from "./routes/admin/ui.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sanitizeInput } from "./middlewares/sanitize.middleware.js";
import { applySecurity } from "./middlewares/security.middleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import cookieParser from "cookie-parser";
import corsMiddleware from "cors";
const cors = typeof corsMiddleware === "function" ? corsMiddleware : corsMiddleware.default || corsMiddleware;
import path from "path";
import { fileURLToPath } from "url";
import { startExpiredReservationSweeper } from "./jobs/releaseExpiredReservations.job.js";
import { startAutoReconciliation } from "./jobs/autoReconciliation.job.js";
import { cleanOldAuditLogs } from "./services/auditLogger.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ── CORS (BEFORE security — browser needs CORS headers on preflight) ───
const isProd = process.env.NODE_ENV === "production";
const ALLOWED_ORIGINS = isProd
  ? ["https://shopacc.com"]
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
     "http://localhost:5176", "http://localhost:5177", "http://localhost:5178",
     "http://localhost:5179", "http://localhost:3000"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = isProd ? ALLOWED_ORIGINS.includes(origin) : true;
  if (allowed && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// ── Security Middleware (after CORS) ─────────────────────────────
applySecurity(app);

// ── Webhook raw body parsers (must be BEFORE express.json) ─────
// PayOS / card webhook signature verification needs raw body
app.use("/api/payment/payos/webhook", express.raw({ type: "application/json" }));
app.use("/api/payment/card/webhook", express.raw({ type: "application/json" }));

// ── Body parsers ────────────────────────────────────────────────
app.use(express.json({ limit: "100kb" })); // 🛡️ Giới hạn body size
app.use(cookieParser());

// ── Sanitize: chống MongoDB operator injection ──────────────────
app.use(sanitizeInput);

// ── Request Logger (BEFORE routes — captures all requests) ──────
app.use(requestLogger);

// ── Global API rate limiter (BEFORE routes — catches all API calls) ──
app.use("/api", apiLimiter);

// ── Routes ──────────────────────────────────────────────────────

// Health check — MUST be first, no auth, no rate limit
app.use("/health", healthRoute);

app.use("/api/auth", authRoute);
app.use("/api/accounts", accountRoute);
app.use("/api/giftcodes", giftcodeRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/admin/reviews", adminReviewRoute);
app.use("/api/user", userRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/sse", sseRoute);
app.use("/api/admin/auth", adminAuthRoute);
app.use("/api/admin/accounts", adminAccountRoute);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/api/admin/upload", uploadRoute);
app.use("/api/admin/deposits", depositRoutes);
app.use("/api/admin/giftcodes", adminGiftcodeRoute);
app.use("/api/admin/reconciliation", reconciliationRoute);
app.use("/api/admin/users", userBalanceRoute);
app.use("/api/admin/audit-logs", auditRoute);
app.use("/api/admin/analytics", analyticsRoute);
app.use("/api/admin/payments-monitor", paymentMonitorRoute);
app.use("/api/admin/admins", adminAdminRoute);
app.use("/api/admin/banks", adminBankAccountRoute);
app.use("/api/admin/config", adminConfigRoute);
app.use("/api/admin/ui", adminUiRouter);
app.use("/api/ui", publicUiRouter);
app.use("/api/admin/orders", adminOrderRoute);
app.use("/api/orders", orderRoutes);

// ── Central error handler (LAST) ─────────────────────────────────
app.use(errorHandler);

// ── Start server ────────────────────────────────────────────────
connectDB()
  .then(() => {
    // Start background sweeper for expired reservations
    startExpiredReservationSweeper();

    // Start automated deposit reconciliation (resolves stale PENDING deposits)
    startAutoReconciliation();

    // Clean up stale audit logs on startup
    cleanOldAuditLogs();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error occurred while starting the server:", err);
    process.exit(1);
  });
