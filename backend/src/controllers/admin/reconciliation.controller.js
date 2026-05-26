import CardDeposit from "../../models/client/deposits/CardDeposit.model.js";
import BankDeposit from "../../models/client/deposits/BankDeposit.model.js";
import Order from "../../models/Order.model.js";
import User from "../../models/client/User.model.js";
import {
  adaptBankDeposit,
  adaptCardDeposit,
} from "../../utils/deposit.adapter.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

// ── Helpers ──────────────────────────────────────────────────────

function getDateRange(dateFrom, dateTo) {
  const range = {};
  if (dateFrom) range.$gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length > 0 ? range : null;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Summary KPIs ─────────────────────────────────────────────────

/**
 * GET /api/admin/reconciliation/summary
 *
 * Returns KPIs for the reconciliation dashboard:
 *  - totalDepositsToday / totalDepositsMonth
 *  - successRate (percentage)
 *  - totalRevenue (from completed orders)
 *  - pendingCount / alertCount
 *  - comparison with previous period
 */
export const getReconciliationSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const yesterdayStart = startOfDay(new Date(now - 24 * 60 * 60 * 1000));

  // ── Today's deposits (bank PAID + card SUCCESS) ────────────────
  const [bankToday, bankTodayTotal, cardToday, cardTodayTotal] = await Promise.all([
    BankDeposit.find({
      status: "PAID",
      createdAt: { $gte: todayStart },
    }).lean(),
    BankDeposit.countDocuments({
      createdAt: { $gte: todayStart },
    }),
    CardDeposit.find({
      status: "SUCCESS",
      createdAt: { $gte: todayStart },
    }).lean(),
    CardDeposit.countDocuments({
      createdAt: { $gte: todayStart },
    }),
  ]);

  const bankTodayAmount = bankToday.reduce((s, d) => s + (d.amount || 0), 0);
  const cardTodayAmount = cardToday.reduce((s, d) => s + (d.receivedAmount || 0), 0);
  const totalDepositsToday = bankTodayAmount + cardTodayAmount;
  const totalTransactionsToday = bankTodayTotal + cardTodayTotal;
  const successToday = bankToday.length + cardToday.length;
  const successRateToday =
    totalTransactionsToday > 0
      ? Math.round((successToday / totalTransactionsToday) * 100)
      : 100;

  // ── Month's deposits ───────────────────────────────────────────
  const [bankMonth, cardMonth] = await Promise.all([
    BankDeposit.find({
      status: "PAID",
      createdAt: { $gte: monthStart },
    }).lean(),
    CardDeposit.find({
      status: "SUCCESS",
      createdAt: { $gte: monthStart },
    }).lean(),
  ]);

  const bankMonthAmount = bankMonth.reduce((s, d) => s + (d.amount || 0), 0);
  const cardMonthAmount = cardMonth.reduce((s, d) => s + (d.receivedAmount || 0), 0);
  const totalDepositsMonth = bankMonthAmount + cardMonthAmount;

  // ── Yesterday's deposits (for trend comparison) ────────────────
  const [bankYesterday, cardYesterday] = await Promise.all([
    BankDeposit.find({
      status: "PAID",
      createdAt: { $gte: yesterdayStart, $lt: todayStart },
    }).lean(),
    CardDeposit.find({
      status: "SUCCESS",
      createdAt: { $gte: yesterdayStart, $lt: todayStart },
    }).lean(),
  ]);

  const yesterdayAmount =
    bankYesterday.reduce((s, d) => s + (d.amount || 0), 0) +
    cardYesterday.reduce((s, d) => s + (d.receivedAmount || 0), 0);

  const depositChange =
    yesterdayAmount > 0
      ? Math.round(((totalDepositsToday - yesterdayAmount) / yesterdayAmount) * 100)
      : totalDepositsToday > 0 ? 100 : 0;

  // ── Total revenue (from completed orders) ──────────────────────
  const revenueToday = await Order.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: todayStart },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).then((r) => r[0]?.total || 0);

  const revenueMonth = await Order.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: monthStart },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).then((r) => r[0]?.total || 0);

  // ── Pending / alerts count ─────────────────────────────────────
  const thirtyMinAgo = new Date(now - 30 * 60 * 1000);
  const [pendingBankCount, pendingCardCount] = await Promise.all([
    BankDeposit.countDocuments({
      status: "PENDING",
      createdAt: { $lte: thirtyMinAgo },
    }),
    CardDeposit.countDocuments({
      status: "PENDING",
      createdAt: { $lte: thirtyMinAgo },
    }),
  ]);

  const alertCount = pendingBankCount + pendingCardCount;

  // ── Recent completed transactions (last 5) for mini-feed ───────
  const [recentBank, recentCard] = await Promise.all([
    BankDeposit.find({ status: "PAID" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "username email")
      .lean(),
    CardDeposit.find({ status: "SUCCESS" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "username email")
      .lean(),
  ]);

  const recentTransactions = [
    ...recentBank.map((d) => ({
      id: d._id,
      type: "bank",
      user: d.user?.username || "unknown",
      amount: d.amount || 0,
      referenceCode: d.referenceCode,
      createdAt: d.createdAt,
    })),
    ...recentCard.map((d) => ({
      id: d._id,
      type: "card",
      user: d.user?.username || "unknown",
      amount: d.receivedAmount || 0,
      provider: d.provider,
      createdAt: d.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      kpis: {
        totalDepositsToday: {
          label: "Nạp tiền hôm nay",
          value: totalDepositsToday,
          suffix: "đ",
          trend: depositChange >= 0 ? "up" : "down",
          change: Math.abs(depositChange),
        },
        totalDepositsMonth: {
          label: "Nạp tiền tháng này",
          value: totalDepositsMonth,
          suffix: "đ",
        },
        successRateToday: {
          label: "Tỷ lệ thành công",
          value: successRateToday,
          suffix: "%",
        },
        totalRevenueToday: {
          label: "Doanh thu hôm nay",
          value: revenueToday,
          suffix: "đ",
        },
        totalRevenueMonth: {
          label: "Doanh thu tháng này",
          value: revenueMonth,
          suffix: "đ",
        },
        pendingAlertCount: {
          label: "Giao dịch treo",
          value: alertCount,
          type: alertCount > 0 ? "warning" : "success",
        },
      },
      depositMethods: [
        {
          method: "bank",
          label: "Chuyển khoản",
          todayCount: bankToday.length,
          todayAmount: bankTodayAmount,
          monthAmount: bankMonthAmount,
        },
        {
          method: "card",
          label: "Thẻ cào",
          todayCount: cardToday.length,
          todayAmount: cardTodayAmount,
          monthAmount: cardMonthAmount,
        },
      ],
      recentTransactions,
    },
  });
});

// ── Deposits List (paginated, filterable) ────────────────────────

/**
 * GET /api/admin/reconciliation/deposits
 *
 * Query params: page, limit, status, type (bank|card), dateFrom, dateTo, search
 *
 * Note: Pagination merges two collections (bank + card) globally sorted by createdAt.
 * We over-fetch from each collection then paginate in memory. This gives correct
 * ordering for reasonable page depths (works up to ~page 7 at 15/pp).
 */
export const getReconciliationDeposits = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 15,
    status,
    type,
    search,
    dateFrom,
    dateTo,
  } = req.query;

  const sort = { createdAt: -1 };
  const dateRange = getDateRange(dateFrom, dateTo);

  const cardFilter = {};
  const bankFilter = {};

  if (status) {
    cardFilter.status = status;
    bankFilter.status = status;
  }
  if (dateRange) {
    cardFilter.createdAt = dateRange;
    bankFilter.createdAt = dateRange;
  }

  // When type filter is specified, skip querying the excluded collection entirely
  const isOnlyCard = type === "card";
  const isOnlyBank = type === "bank";

  // Search by username/email
  if (search) {
    const users = await User.find({
      $or: [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userIds = users.map((u) => u._id);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: { deposits: [], totalPages: 0, currentPage: +page, totalItems: 0 },
      });
    }
    cardFilter.user = { $in: userIds };
    bankFilter.user = { $in: userIds };
  }

  // ── Correct pagination: over-fetch from each collection, merge, then paginate ──
  // Since we can't $unionWith + populate in Mongoose, we over-fetch enough items
  // from each collection so the in-memory merge gives correct global ordering.
  // The over-fetch factor grows with page number to handle skewed distributions.
  // For admin tooling this is acceptable (no deep paging expected).
  const fetchLimit = Math.max(100, (Number(page) + 1) * Number(limit));

  let cardDocs = [];
  let bankDocs = [];
  let cardTotal = 0;
  let bankTotal = 0;

  if (!isOnlyBank) {
    [cardDocs, cardTotal] = await Promise.all([
      CardDeposit.find(cardFilter)
        .populate("user", "username email")
        .sort(sort)
        .limit(fetchLimit)
        .lean(),
      CardDeposit.countDocuments(cardFilter),
    ]);
  }

  if (!isOnlyCard) {
    [bankDocs, bankTotal] = await Promise.all([
      BankDeposit.find(bankFilter)
        .populate("user", "username email")
        .populate("bank", "bankName accountNumber accountHolder")
        .sort(sort)
        .limit(fetchLimit)
        .lean(),
      BankDeposit.countDocuments(bankFilter),
    ]);
  }

  const adaptedCard = (cardDocs || []).map(adaptCardDeposit);
  const adaptedBank = (bankDocs || []).map(adaptBankDeposit);

  // Globally sort by createdAt descending
  const allDeposits = [...adaptedCard, ...adaptedBank].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const totalItems = cardTotal + bankTotal;
  const totalPages = Math.ceil(totalItems / Number(limit));
  const skip = (Number(page) - 1) * Number(limit);
  const paginated = allDeposits.slice(skip, skip + Number(limit));

  res.json({
    success: true,
    message: "Lấy danh sách giao dịch thành công",
    data: {
      deposits: paginated,
      totalPages,
      currentPage: +page,
      totalItems,
    },
  });
});

// ── Alerts ───────────────────────────────────────────────────────

/**
 * GET /api/admin/reconciliation/alerts
 *
 * Detects:
 *   1. Pending deposits older than 30 minutes (stale)
 *   2. Card deposits with amount mismatch
 *
 * Returns grouped alerts sorted by severity then newest.
 */
export const getReconciliationAlerts = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyMinAgo = new Date(now - 30 * 60 * 1000);
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  const alerts = [];

  // ── 1. Stale PENDING bank deposits (> 30 min) ──────────────────
  const staleBankDeposits = await BankDeposit.find({
    status: "PENDING",
    createdAt: { $lte: thirtyMinAgo },
  })
    .populate("user", "username email")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  for (const d of staleBankDeposits) {
    alerts.push({
      type: "stale_bank_deposit",
      severity: d.createdAt < oneHourAgo ? "critical" : "warning",
      depositId: d._id,
      user: d.user?.username || "unknown",
      expectedAmount: d.expectedAmount,
      referenceCode: d.referenceCode,
      createdAt: d.createdAt,
      ageMinutes: Math.round((now - d.createdAt) / 60000),
      message: `Giao dịch ngân hàng ${d.referenceCode} treo ${Math.round((now - d.createdAt) / 60000)} phút`,
    });
  }

  // ── 2. Stale PENDING card deposits (> 30 min) ──────────────────
  const staleCardDeposits = await CardDeposit.find({
    status: "PENDING",
    createdAt: { $lte: thirtyMinAgo },
  })
    .populate("user", "username email")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  for (const d of staleCardDeposits) {
    alerts.push({
      type: "stale_card_deposit",
      severity: d.createdAt < oneHourAgo ? "critical" : "warning",
      depositId: d._id,
      user: d.user?.username || "unknown",
      declaredValue: d.declaredValue,
      provider: d.provider,
      serial: d.serial ? `***${d.serial.slice(-4)}` : "****",
      createdAt: d.createdAt,
      ageMinutes: Math.round((now - d.createdAt) / 60000),
      message: `Nạp thẻ ${d.provider} treo ${Math.round((now - d.createdAt) / 60000)} phút`,
    });
  }

  // ── 3. Amount mismatch (card deposits) ─────────────────────────
  const mismatchedCards = await CardDeposit.find({
    status: { $in: ["SUCCESS", "FAILED"] },
    isAmountMismatch: true,
  })
    .populate("user", "username email")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  for (const d of mismatchedCards) {
    alerts.push({
      type: "amount_mismatch",
      severity: "warning",
      depositId: d._id,
      user: d.user?.username || "unknown",
      provider: d.provider,
      declaredValue: d.declaredValue,
      receivedAmount: d.receivedAmount,
      createdAt: d.createdAt,
      message: `Thẻ ${d.provider} không đúng mệnh giá: khai báo ${d.declaredValue?.toLocaleString()}đ, thực nhận ${d.receivedAmount?.toLocaleString()}đ`,
    });
  }

  // Sort by severity (critical first) then by newest
  alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const aSev = severityOrder[a.severity] ?? 2;
    const bSev = severityOrder[b.severity] ?? 2;
    if (aSev !== bSev) return aSev - bSev;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json({
    success: true,
    data: {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      alerts,
    },
  });
});
