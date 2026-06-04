import Order from "../../models/Order.model.js";
import User from "../../models/client/User.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { generateId } from "../../utils/generateId.js";

/**
 * GET /api/admin/orders
 * List all orders with pagination, search, and filters
 */
export const listOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentMethod,
    search,
    dateFrom,
    dateTo,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const filter = {};

  // Status filter
  if (status) filter.status = status;

  // Payment method filter
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  // Date range filter
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Search by transactionId or notes
  if (search) {
    filter.$or = [
      { transactionId: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "username email displayName")
      .populate("account", "title game price")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total,
    },
  });
});

/**
 * GET /api/admin/orders/:id
 * Get order detail by ID
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("user", "username email displayName balance")
    .populate("account", "title game price type images loginInfo attributes")
    .lean();

  if (!order) {
    throw new AppError("Không tìm thấy đơn hàng", 404);
  }

  res.json({
    success: true,
    data: { order },
  });
});

/**
 * GET /api/admin/orders/stats
 * Order statistics summary
 */
export const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const result = {
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    totalAmount: 0,
    totalOrders: 0,
  };

  for (const s of stats) {
    result[s._id] = s.count;
    result.totalAmount += s.totalAmount || 0;
    result.totalOrders += s.count;
  }

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStats = await Order.aggregate([
    { $match: { createdAt: { $gte: today } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: "$amount" },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      byStatus: result,
      today: todayStats[0]
        ? { count: todayStats[0].count, revenue: todayStats[0].revenue }
        : { count: 0, revenue: 0 },
    },
  });
});

/**
 * GET /api/admin/orders/export
 * Export orders as CSV
 */
export const exportOrdersCsv = asyncHandler(async (req, res) => {
  const { status, paymentMethod, dateFrom, dateTo } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const orders = await Order.find(filter)
    .populate("user", "username email")
    .populate("account", "title game")
    .sort({ createdAt: -1 })
    .lean();

  // CSV header
  const headers = [
    "Mã giao dịch",
    "Người dùng",
    "Tài khoản",
    "Game",
    "Số tiền",
    "Giá gốc",
    "Phương thức",
    "Trạng thái",
    "Giảm giá",
    "Ghi chú",
    "Ngày tạo",
    "Ngày hoàn thành",
  ];

  const csvRows = [headers.join(",")];
  for (const order of orders) {
    const row = [
      order.transactionId,
      order.user?.username || "N/A",
      `"${(order.account?.title || "N/A").replace(/"/g, '""')}"`,
      order.account?.game || "N/A",
      order.amount,
      order.originalPrice || "",
      order.paymentMethod,
      order.status,
      order.discount?.code || "",
      `"${(order.notes || "").replace(/"/g, '""')}"`,
      order.createdAt ? new Date(order.createdAt).toISOString() : "",
      order.completedAt ? new Date(order.completedAt).toISOString() : "",
    ];
    csvRows.push(row.join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=orders_${Date.now()}.csv`,
  );
  // Add BOM for Vietnamese characters
  res.send("\uFEFF" + csvRows.join("\n"));
});
