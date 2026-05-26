import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../../models/client/User.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { logBalanceChange } from "../../services/auditLogger.service.js";
import { logAdminAction } from "../../services/adminAudit.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_DIR =
  process.env.AUDIT_LOG_DIR ||
  path.resolve(__dirname, "../../../logs/audit");

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Read audit log lines for a specific userId, optionally filtered by date.
 * Returns newest-first, paginated.
 */
function readBalanceLog(userId, { dateFrom, dateTo, page = 1, limit = 50 }) {
  const results = [];
  const dir = AUDIT_DIR;

  if (!fs.existsSync(dir)) {
    return { entries: [], total: 0 };
  }

  // Determine which log files to scan
  const files = fs.readdirSync(dir).filter((f) => f.startsWith("balance-") && f.endsWith(".jsonl"));

  // If date range specified, only scan relevant files
  let relevantFiles = files;
  if (dateFrom || dateTo) {
    const from = dateFrom ? new Date(dateFrom) : new Date(0);
    const to = dateTo ? new Date(dateTo) : new Date();
    relevantFiles = files.filter((f) => {
      const datePart = f.slice(8, 18); // "2026-05-27"
      const fileDate = new Date(datePart + "T00:00:00.000Z");
      return fileDate >= from && fileDate <= to;
    });
  }

  // Read files newest-first
  relevantFiles.sort().reverse();

  for (const file of relevantFiles) {
    try {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const lines = content.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.userId === userId) {
            results.push(entry);
          }
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Sort by timestamp descending
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const total = results.length;
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  return { entries: paginated, total };
}

// ── Controllers ──────────────────────────────────────────────────

/**
 * GET /api/admin/users/search?q=...
 *
 * Search users by username or email (case-insensitive, partial match).
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json({ success: true, data: [] });
  }

  const regex = new RegExp(q.trim(), "i");
  const users = await User.find({
    $or: [
      { username: regex },
      { email: regex },
      { displayName: regex },
    ],
  })
    .select("username email displayName")
    .limit(20)
    .lean();

  res.json({
    success: true,
    data: users.map((u) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
    })),
  });
});

/**
 * GET /api/admin/users/:userId/balance-log
 *
 * Returns audit log entries for a specific user.
 * Query params: dateFrom, dateTo, page, limit
 */
export const getUserBalanceLog = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { dateFrom, dateTo, page = 1, limit = 50 } = req.query;

  // Verify user exists
  const user = await User.findById(userId).select("username email displayName balance");
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  const { entries, total } = readBalanceLog(userId, {
    dateFrom,
    dateTo,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        currentBalance: user.balance,
      },
      entries,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalItems: total,
    },
  });
});

/**
 * POST /api/admin/users/:userId/balance-adjust
 *
 * Admin adjusts a user's balance with a mandatory reason.
 * Body: { amount: number, reason: string }
 *
 * amount > 0: credit (add balance)
 * amount < 0: debit (subtract balance)
 */
export const adjustUserBalance = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { amount, reason } = req.body;

  if (!amount || typeof amount !== "number" || amount === 0) {
    throw new AppError("Số tiền điều chỉnh phải khác 0", 400);
  }

  if (!reason || reason.trim().length < 5) {
    throw new AppError("Vui lòng nhập lý do điều chỉnh (tối thiểu 5 ký tự)", 400);
  }

  const user = await User.findById(userId).select("username displayName balance");
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  const balanceBefore = user.balance;
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { balance: amount } },
    { new: true, select: "balance displayName username" },
  );

  if (!updatedUser) {
    throw new AppError("Không thể cập nhật số dư", 500);
  }

  // Audit log
  logBalanceChange({
    userId,
    userName: updatedUser.displayName || updatedUser.username,
    type: "admin_adjust",
    amount,
    balanceBefore,
    balanceAfter: updatedUser.balance,
    reference: `admin-${req.admin?._id || "unknown"}`,
    note: reason.trim(),
    ip: req.ip,
  });

  // ── Admin action audit ──────────────────────────────────────
  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "balance:adjust",
    resource: "user_balance",
    resourceId: userId,
    details: {
      username: updatedUser.displayName || updatedUser.username,
      previousBalance: balanceBefore,
      newBalance: updatedUser.balance,
      adjustment: amount,
      reason: reason.trim(),
    },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: `Đã điều chỉnh số dư ${amount > 0 ? "+" : ""}${amount.toLocaleString("vi-VN")}đ`,
    data: {
      userId,
      username: updatedUser.displayName || updatedUser.username,
      previousBalance: balanceBefore,
      newBalance: updatedUser.balance,
      adjustment: amount,
      reason: reason.trim(),
    },
  });
});
