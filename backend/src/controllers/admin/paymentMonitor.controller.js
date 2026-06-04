/**
 * Payment Monitoring Controller
 *
 * Endpoints for the admin Payment Monitoring dashboard:
 *   - GET  /summary        → KPIs (today, month, success rate, pending, webhook count)
 *   - GET  /webhook-logs   → Recent webhook activity (PayOS + Card)
 *   - GET  /recent         → Recent deposit transactions (bank + card combined)
 *   - GET  /stats          → Status & method distribution
 */
import mongoose from "mongoose";
import BankDeposit from "../../models/client/deposits/BankDeposit.model.js";
import CardDeposit from "../../models/client/deposits/CardDeposit.model.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

// ── Helpers ──────────────────────────────────────────────────────

const TODAY_START = () => new Date(new Date().setHours(0, 0, 0, 0));
const TODAY_END = () => new Date(new Date().setHours(23, 59, 59, 999));
const MONTH_START = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

// ── GET /summary ─────────────────────────────────────────────────

export const getPaymentSummary = asyncHandler(async (req, res) => {
  const todayStart = TODAY_START();
  const todayEnd = TODAY_END();
  const monthStart = MONTH_START();

  // ── Bank deposits today ──────────────────────────────────────
  const [bankToday, bankTodaySuccessful] = await Promise.all([
    BankDeposit.aggregate([
      { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
          webhookCount: { $sum: { $cond: [{ $ifNull: ["$transactionData", false] }, 1, 0] } },
        },
      },
    ]),
    // Count successful (PAID) today for success rate
    BankDeposit.countDocuments({
      status: "PAID",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  // ── Bank deposits this month ─────────────────────────────────
  const bankMonthAgg = await BankDeposit.aggregate([
    { $match: { createdAt: { $gte: monthStart } } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  // ── Card deposits today ──────────────────────────────────────
  const [cardToday, cardTodaySuccessful] = await Promise.all([
    CardDeposit.aggregate([
      { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: "$receivedAmount" },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
          webhookCount: {
            $sum: {
              $cond: [{ $and: [{ $ifNull: ["$apiTransId", false] }, { $ne: ["$apiStatusCode", null] }] }, 1, 0],
            },
          },
        },
      },
    ]),
    CardDeposit.countDocuments({
      status: "SUCCESS",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  // ── Card deposits this month ─────────────────────────────────
  const cardMonthAgg = await CardDeposit.aggregate([
    { $match: { createdAt: { $gte: monthStart } } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  // ── Compile ──────────────────────────────────────────────────
  const bToday = bankToday[0] || { count: 0, totalAmount: 0, pendingCount: 0, webhookCount: 0 };
  const cToday = cardToday[0] || { count: 0, totalAmount: 0, pendingCount: 0, webhookCount: 0 };
  const bMonth = bankMonthAgg[0] || { totalAmount: 0, count: 0 };
  const cMonth = cardMonthAgg[0] || { totalAmount: 0, count: 0 };

  const todayTotalCount = bToday.count + cToday.count;
  const todaySuccessCount = bankTodaySuccessful + cardTodaySuccessful;
  const successRate = todayTotalCount > 0 ? Math.round((todaySuccessCount / todayTotalCount) * 100) : 0;

  res.json({
    success: true,
    data: {
      today: {
        totalCount: todayTotalCount,
        totalAmount: bToday.totalAmount + cToday.totalAmount,
        successCount: todaySuccessCount,
        successRate,
        pendingCount: bToday.pendingCount + cToday.pendingCount,
        webhookCount: bToday.webhookCount + cToday.webhookCount,
        breakdown: {
          bank: { count: bToday.count, amount: bToday.totalAmount, pending: bToday.pendingCount },
          card: { count: cToday.count, amount: cToday.totalAmount, pending: cToday.pendingCount },
        },
      },
      month: {
        totalAmount: bMonth.totalAmount + cMonth.totalAmount,
        totalCount: bMonth.count + cMonth.count,
      },
    },
  });
});

// ── GET /webhook-logs ────────────────────────────────────────────

export const getWebhookLogs = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;
  const limitNum = Math.min(parseInt(limit) || 50, 200);
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const skip = (pageNum - 1) * limitNum;

  // ⚠️ Over-fetch from both collections (no skip per-collection — sai số mixed pagination)
  // Fetch enough to cover the worst case where all page items come from one collection
  const fetchLimit = pageNum * limitNum + limitNum;

  const [bankWebhooks, bankTotal] = await Promise.all([
    BankDeposit.find({ transactionData: { $exists: true, $ne: null } })
      .sort({ updatedAt: -1 })
      .limit(fetchLimit)
      .populate("user", "username displayName")
      .select("referenceCode amount status type orderCode createdAt updatedAt transactionData payosOrderId")
      .lean(),
    BankDeposit.countDocuments({ transactionData: { $exists: true, $ne: null } }),
  ]);

  const [cardWebhooks, cardTotal] = await Promise.all([
    CardDeposit.find({ providerResponse: { $exists: true, $ne: null } })
      .sort({ updatedAt: -1 })
      .limit(fetchLimit)
      .populate("user", "username displayName")
      .select("provider serial status declaredValue receivedAmount createdAt updatedAt providerResponse apiTransId apiStatusCode isAmountMismatch")
      .lean(),
    CardDeposit.countDocuments({ providerResponse: { $exists: true, $ne: null } }),
  ]);

  // Format bank webhooks
  const formattedBank = bankWebhooks.map((d) => ({
    id: d._id,
    type: "payos" + (d.type === "purchase" ? "_purchase" : ""),
    provider: "PayOS",
    amount: d.amount,
    referenceCode: d.referenceCode,
    orderCode: d.orderCode,
    status: d.status,
    user: d.user,
    webhookReceivedAt: d.updatedAt,
    hasTransactionData: !!d.transactionData,
    payosOrderId: d.payosOrderId,
    createdAt: d.createdAt,
  }));

  // Format card webhooks
  const formattedCard = cardWebhooks.map((d) => ({
    id: d._id,
    type: "card",
    provider: d.provider,
    amount: d.receivedAmount || d.declaredValue,
    declaredValue: d.declaredValue,
    status: d.status,
    user: d.user,
    webhookReceivedAt: d.updatedAt,
    apiTransId: d.apiTransId,
    apiStatusCode: d.apiStatusCode,
    isAmountMismatch: d.isAmountMismatch,
    serial: d.serial ? "***" + d.serial.slice(-4) : "****",
    createdAt: d.createdAt,
  }));

  // Merge + sort by webhookReceivedAt desc + in-memory pagination
  const allWebhooks = [...formattedBank, ...formattedCard]
    .sort((a, b) => new Date(b.webhookReceivedAt) - new Date(a.webhookReceivedAt))
    .slice(skip, skip + limitNum);

  const totalItems = bankTotal + cardTotal;

  res.json({
    success: true,
    data: {
      webhooks: allWebhooks,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      totalItems,
    },
  });
});

// ── GET /recent ──────────────────────────────────────────────────

export const getRecentTransactions = asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;
  const limitNum = Math.min(parseInt(limit) || 30, 100);

  const [bankDeposits, cardDeposits] = await Promise.all([
    BankDeposit.find()
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .populate("user", "username displayName email")
      .select("referenceCode amount status type orderCode createdAt updatedAt bank discount expectedAmount")
      .lean(),
    CardDeposit.find()
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .populate("user", "username displayName email")
      .select("provider serial status declaredValue receivedAmount createdAt updatedAt discount isAmountMismatch")
      .lean(),
  ]);

  const formattedBank = bankDeposits.map((d) => ({
    id: d._id,
    type: d.type === "purchase" ? "purchase" : "bank",
    method: d.type === "purchase" ? "PayOS (Mua)" : "Chuyển khoản",
    amount: d.amount || d.expectedAmount,
    expectedAmount: d.expectedAmount,
    status: d.status,
    referenceCode: d.referenceCode,
    user: d.user,
    discount: d.discount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  const formattedCard = cardDeposits.map((d) => ({
    id: d._id,
    type: "card",
    method: `Thẻ ${d.provider}`,
    amount: d.receivedAmount || d.declaredValue,
    declaredValue: d.declaredValue,
    status: d.status,
    referenceCode: d.serial ? "***" + d.serial.slice(-4) : "****",
    user: d.user,
    discount: d.discount,
    isAmountMismatch: d.isAmountMismatch,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  const allTransactions = [...formattedBank, ...formattedCard]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limitNum);

  res.json({
    success: true,
    data: {
      transactions: allTransactions,
      total: allTransactions.length,
    },
  });
});

// ── GET /stats ───────────────────────────────────────────────────

export const getPaymentStats = asyncHandler(async (req, res) => {
  // Status distribution (combined bank + card)
  const [bankStatusCounts, cardStatusCounts] = await Promise.all([
    BankDeposit.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    CardDeposit.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  // Method breakdown (bank vs card totals)
  const [bankTotals, cardTotals] = await Promise.all([
    BankDeposit.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
    ]),
    CardDeposit.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$receivedAmount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$receivedAmount" },
        },
      },
    ]),
  ]);

  // Last 7 days daily volume
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [bankDaily, cardDaily] = await Promise.all([
    BankDeposit.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    CardDeposit.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          totalAmount: { $sum: "$receivedAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Merge daily stats
  const dailyVolumeMap = {};
  for (const d of bankDaily) {
    dailyVolumeMap[d._id] = { date: d._id, bankCount: d.count, bankAmount: d.totalAmount, cardCount: 0, cardAmount: 0 };
  }
  for (const d of cardDaily) {
    if (dailyVolumeMap[d._id]) {
      dailyVolumeMap[d._id].cardCount = d.count;
      dailyVolumeMap[d._id].cardAmount = d.totalAmount;
    } else {
      dailyVolumeMap[d._id] = { date: d._id, bankCount: 0, bankAmount: 0, cardCount: d.count, cardAmount: d.totalAmount };
    }
  }
  const dailyVolume = Object.values(dailyVolumeMap).sort((a, b) => a.date.localeCompare(b.date));

  // Merge status counts
  const statusDistribution = {};
  for (const s of bankStatusCounts) statusDistribution[s._id] = (statusDistribution[s._id] || 0) + s.count;
  for (const s of cardStatusCounts) statusDistribution[s._id] = (statusDistribution[s._id] || 0) + s.count;

  // Card provider breakdown
  const providerBreakdown = await CardDeposit.aggregate([
    { $group: { _id: "$provider", count: { $sum: 1 }, totalAmount: { $sum: "$receivedAmount" } } },
    { $sort: { count: -1 } },
  ]);

  const bt = bankTotals[0] || { totalAmount: 0, count: 0, avgAmount: 0 };
  const ct = cardTotals[0] || { totalAmount: 0, count: 0, avgAmount: 0 };

  res.json({
    success: true,
    data: {
      statusDistribution,
      methodBreakdown: {
        bank: { count: bt.count, totalAmount: bt.totalAmount, avgAmount: Math.round(bt.avgAmount || 0) },
        card: { count: ct.count, totalAmount: ct.totalAmount, avgAmount: Math.round(ct.avgAmount || 0) },
      },
      providerBreakdown,
      dailyVolume,
    },
  });
});
