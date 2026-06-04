import Account from "../../models/Account.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { logAdminAction } from "../../services/adminAudit.service.js";

// ============================================================================
// LIST ACCOUNTS
// GET /api/admin/accounts
// ============================================================================

export const getAccounts = asyncHandler(async (req, res) => {
  const {
    game,
    type,
    status,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const query = {};
  const parseMultiQuery = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const gameFilters = parseMultiQuery(game);
  const typeFilters = parseMultiQuery(type);
  const statusFilters = parseMultiQuery(status);

  if (gameFilters.length === 1) query.game = gameFilters[0];
  if (gameFilters.length > 1) query.game = { $in: gameFilters };

  if (typeFilters.length === 1) query.type = typeFilters[0];
  if (typeFilters.length > 1) query.type = { $in: typeFilters };

  const hasActive = statusFilters.includes("active");
  const hasInactive = statusFilters.includes("inactive");
  if (hasActive && !hasInactive) query.isActive = true;
  if (!hasActive && hasInactive) query.isActive = false;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { "loginInfo.username": { $regex: search, $options: "i" } },
    ];
  }

  const [accounts, total] = await Promise.all([
    Account.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select("+loginInfo"), // Admin được xem loginInfo
    Account.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      accounts,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      totalItems: total,
    },
  });
});

// ============================================================================
//  GET ACCOUNT BY ID
// GET /api/admin/accounts/:id
// ============================================================================

export const getAccountById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const account = await Account.findById(id).select("+loginInfo");

  if (!account) {
    throw new AppError("Tài khoản không tồn tại", 404);
  }

  res.json({ success: true, data: { account } });
});

// ============================================================================
// CREATE ACCOUNT
// POST /api/admin/accounts
// ============================================================================

export const createAccount = asyncHandler(async (req, res) => {
  const {
    title,
    game,
    price,
    description,
    attributes,
    images,
    type,
    loginInfo,
  } = req.body;

  if (
    !title ||
    !game ||
    !price ||
    !loginInfo?.username ||
    !loginInfo?.password
  ) {
    throw new AppError("Vui lòng điền đầy đủ thông tin", 400);
  }

  const exist = await Account.findOne({
    "loginInfo.username": loginInfo.username,
    game,
    isSold: false,
  });
  if (exist) {
    throw new AppError("Tài khoản game này đã tồn tại trong hệ thống", 409);
  }

  const account = await Account.create({
    title,
    game,
    price: Number(price),
    description: description || "",
    attributes: attributes || {},
    images: images || [],
    type: type || "standard",
    loginInfo,
  });

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "account:create",
    resource: "account",
    resourceId: account._id,
    details: { title, game, price, type },
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Tạo tài khoản thành công",
    data: { account },
  });
});

// ============================================================================
// UPDATE ACCOUNT
// PUT /api/admin/accounts/:id
// ============================================================================

export const updateAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ⚠️ Whitelist strict — chỉ cho update các field an toàn
  const ALLOWED_FIELDS = [
    "title", "game", "price", "description", "attributes",
    "images", "type", "loginInfo", "isActive",
  ];
  const updateData = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in req.body) {
      updateData[key] = req.body[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError("Không có trường nào được phép cập nhật", 400);
  }

  // Không cho phép update trực tiếp owner nếu không phải admin
  if (req.admin.role !== "admin" && req.admin.role !== "super_admin") {
    throw new AppError("Bạn không có quyền thực hiện thao tác này", 403);
  }

  const account = await Account.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  ).select("+loginInfo");

  if (!account) {
    throw new AppError("Tài khoản không tồn tại", 404);
  }

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "account:update",
    resource: "account",
    resourceId: account._id,
    details: { changes: Object.keys(updateData) },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "Cập nhật thành công",
    data: { account },
  });
});

// ============================================================================
// TOGGLE STATUS (Hide/Show public)
// PATCH /api/admin/accounts/:id/status
// ============================================================================

export const toggleAccountStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const account = await Account.findByIdAndUpdate(
    id,
    { $set: { isActive: isActive !== false } },
    { new: true },
  );

  if (!account) {
    throw new AppError("Tài khoản không tồn tại", 404);
  }
  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "account:toggle",
    resource: "account",
    resourceId: account._id,
    details: { isActive: isActive !== false, title: account.title },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: isActive ? "Đã hiển thị tài khoản" : "Đã ẩn tài khoản",
    data: { account },
  });
});

// ============================================================================
//  DELETE ACCOUNT (Admin only)
// DELETE /api/admin/accounts/:id
// ============================================================================

export const deleteAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Không cho phép xóa tài khoản nếu không phải admin
  if (req.admin.role !== "admin" && req.admin.role !== "super_admin") {
    throw new AppError("Bạn không có quyền thực hiện thao tác này", 403);
  }

  const account = await Account.findByIdAndDelete(id);

  if (!account) {
    throw new AppError("Tài khoản không tồn tại", 404);
  }

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "account:delete",
    resource: "account",
    resourceId: account._id,
    details: { title: account.title, game: account.game },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "Xóa tài khoản thành công",
    data: { account },
  });
});

// ============================================================================
// EXPORT ACCOUNTS CSV
// GET /api/admin/accounts/export
// ============================================================================

export const exportAccountsCsv = asyncHandler(async (req, res) => {
  const { game, status, type } = req.query;

  const query = { isSold: false };
  if (game) query.game = game;
  if (status === "active") query.isActive = true;
  if (status === "inactive") query.isActive = false;
  if (type) query.type = type;

  const accounts = await Account.find(query)
    .select("+loginInfo")
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    "Tiêu đề",
    "Game",
    "Giá",
    "Loại",
    "Trạng thái",
    "Username",
    "Password",
    "Mô tả",
    "Đã bán",
    "Ngày tạo",
  ];

  const csvRows = [headers.join(",")];
  for (const acc of accounts) {
    const row = [
      `"${(acc.title || "").replace(/"/g, '""')}"`,
      acc.game || "",
      acc.price,
      acc.type || "standard",
      acc.isActive ? "active" : "inactive",
      `"${(acc.loginInfo?.username || "").replace(/"/g, '""')}"`,
      `"${(acc.loginInfo?.password || "").replace(/"/g, '""')}"`,
      `"${(acc.description || "").replace(/"/g, '""')}"`,
      acc.isSold ? "Yes" : "No",
      acc.createdAt ? new Date(acc.createdAt).toISOString() : "",
    ];
    csvRows.push(row.join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=accounts_${Date.now()}.csv`,
  );
  res.send("\uFEFF" + csvRows.join("\n"));
});
