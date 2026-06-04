import Order from "../../models/Order.model.js";
import Account from "../../models/Account.model.js";
import User from "../../models/client/User.model.js";
import CardDeposit from "../../models/client/deposits/CardDeposit.model.js";
import BankDeposit from "../../models/client/deposits/BankDeposit.model.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, game } = req.query;

  // Build date filter
  const dateFilter = {};
  if (dateFrom || dateTo) {
    dateFilter.createdAt = {};
    if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
  }

  // ✅ FIX: Query từ Order thay vì Account
  const orderFilter = { ...dateFilter, status: "completed" };

  // Nếu filter theo game, cần lookup account trước
  if (game) {
    const accountIds = await Account.find({ game }).distinct("_id");
    orderFilter.account = { $in: accountIds };
  }

  // 📊 KPIs - Tính từ Order (doanh thu thực)
  const [totalRevenue, totalOrders, newUsers, activeAccounts] = await Promise.all([
    // Doanh thu = tổng amount của completed orders
    Order.aggregate([
      { $match: orderFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).then((result) => result[0]?.total || 0),

    // Số đơn completed
    Order.countDocuments(orderFilter),

    // User mới
    User.countDocuments(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),

    // Accounts đang bán (chưa sold)
    Account.countDocuments({ isActive: true, isSold: false }),
  ]);

  // 📈 Revenue trend - Group by day từ Order
  const revenueTrend = await Order.aggregate([
    { $match: orderFilter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 },
      },
    },
    { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
    { $sort: { date: 1 } },
  ]);

  // 🎮 Game distribution - Từ completed orders (lookup account)
  const gameDistribution = await Order.aggregate([
    { $match: orderFilter },
    {
      $lookup: {
        from: "accounts",
        localField: "account",
        foreignField: "_id",
        as: "accountInfo",
      },
    },
    { $unwind: "$accountInfo" },
    {
      $group: {
        _id: "$accountInfo.game",
        count: { $sum: 1 },
        revenue: { $sum: "$amount" },
      },
    },
    { $project: { _id: 0, game: "$_id", count: 1, revenue: 1 } },
    { $sort: { revenue: -1 } },
  ]);

  // 🕐 Recent activities - Từ Order
  const recentOrders = await Order.find(orderFilter)
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "username email")
    .populate("account", "title game price")
    .lean();

  const recentActivities = recentOrders.map((order) => ({
    id: order._id.toString(),
    type: "account_sold",
    description: order.account?.title || "Unknown",
    amount: order.amount,
    user: {
      username: order.user?.username,
      email: order.user?.email,
    },
    createdAt: order.createdAt,
  }));

  // 💳 Deposit methods (từ CardDeposit + BankDeposit)
  const [cardDeposits, bankDeposits] = await Promise.all([
    CardDeposit.find({
      ...dateFilter,
      status: "SUCCESS",
    }).lean(),
    BankDeposit.find({
      ...dateFilter,
      status: "PAID",
    }).lean(),
  ]);

  const depositMethods = [
    {
      method: "card",
      label: "Thẻ cào",
      count: cardDeposits.length,
      totalAmount: cardDeposits.reduce(
        (sum, d) => sum + (d.receivedAmount || 0),
        0
      ),
    },
    {
      method: "bank",
      label: "Chuyển khoản",
      count: bankDeposits.length,
      totalAmount: bankDeposits.reduce((sum, d) => sum + d.amount, 0),
    },
  ];

  // 📊 Tính % thay đổi so với kỳ trước (optional)
  const previousPeriodDays = Math.ceil(
    (new Date(dateTo || Date.now()) - new Date(dateFrom || Date.now() - 7 * 24 * 60 * 60 * 1000)) /
      (1000 * 60 * 60 * 24)
  );
  const previousDateFrom = new Date(
    new Date(dateFrom || Date.now() - 7 * 24 * 60 * 60 * 1000) -
      previousPeriodDays * 24 * 60 * 60 * 1000
  );
  const previousDateTo = new Date(
    new Date(dateFrom || Date.now() - 7 * 24 * 60 * 60 * 1000) - 1
  );

  const previousRevenue = await Order.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: previousDateFrom, $lte: previousDateTo },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).then((result) => result[0]?.total || 0);

  const revenueChange =
    previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

  res.json({
    success: true,
    message: "Lấy analytics dashboard thành công",
    data: {
      dateRange: {
        from: dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: dateTo || new Date().toISOString(),
      },
      kpis: {
        totalRevenue: {
          label: "Doanh thu",
          value: totalRevenue,
          suffix: "đ",
          trend: revenueChange >= 0 ? "up" : "down",
          change: Math.abs(revenueChange),
        },
        totalOrders: {
          label: "Đơn hàng",
          value: totalOrders,
          trend: "up",
          change: 0, // TODO: Tính nếu cần
        },
        newUsers: {
          label: "User mới",
          value: newUsers,
          trend: "neutral",
        },
        activeAccounts: {
          label: "Tài khoản đang bán",
          value: activeAccounts,
        },
      },
      revenueTrend,
      gameDistribution,
      depositMethods,
      recentActivities,
    },
  });
});

/**
 * GET /api/admin/analytics/revenue-trend
 * Chỉ trả về revenue trend (dùng để refresh chart)
 */
export const getRevenueTrend = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, game } = req.query;

  const dateFilter = {};
  if (dateFrom || dateTo) {
    dateFilter.createdAt = {};
    if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
  }

  const orderFilter = { ...dateFilter, status: "completed" };

  if (game) {
    const accountIds = await Account.find({ game }).distinct("_id");
    orderFilter.account = { $in: accountIds };
  }

  const revenueTrend = await Order.aggregate([
    { $match: orderFilter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 },
      },
    },
    { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
    { $sort: { date: 1 } },
  ]);

  res.json({
    success: true,
    data: revenueTrend,
  });
});