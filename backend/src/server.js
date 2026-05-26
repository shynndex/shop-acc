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

import paymentRoute from "./routes/payment.route.js";
import adminAuthRoute from "./routes/admin/auth.route.js";
import adminAccountRoute from "./routes/admin/account.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sanitizeInput } from "./middlewares/sanitize.middleware.js";
import { applySecurity } from "./middlewares/security.middleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { startExpiredReservationSweeper } from "./jobs/releaseExpiredReservations.job.js";
import { cleanOldAuditLogs } from "./services/auditLogger.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ── Phase 4: Security Middleware (applied FIRST, before any route) ──
applySecurity(app);

// ── CORS ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

// ── Webhook raw body parsers (must be BEFORE express.json) ─────
// PayOS / card webhook signature verification needs raw body
app.use("/api/payment/payos/webhook", express.raw({ type: "application/json" }));
app.use("/api/payment/card/webhook", express.raw({ type: "application/json" }));

// ── Body parsers ────────────────────────────────────────────────
app.use(express.json({ limit: "100kb" })); // 🛡️ Giới hạn body size
app.use(cookieParser());

// ── Sanitize: chống MongoDB operator injection ──────────────────
app.use(sanitizeInput);

// ── Global API rate limiter (BEFORE routes — catches all API calls) ──
app.use("/api", apiLimiter);

// ── Routes ──────────────────────────────────────────────────────
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
app.use("/api/orders", orderRoutes);

// ── Central error handler (LAST) ─────────────────────────────────
app.use(errorHandler);

// ── Start server ────────────────────────────────────────────────
connectDB()
  .then(() => {
    // Start background sweeper for expired reservations
    startExpiredReservationSweeper();

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
