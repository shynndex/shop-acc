import Admin from "../../models/admin/Admin.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { logAdminAction } from "../../services/adminAudit.service.js";

/**
 * GET /api/admin/admins
 * List all admin accounts (super_admin only)
 */
export const listAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const filter = {};
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [admins, totalItems] = await Promise.all([
    Admin.find(filter)
      .select("-password -refreshToken -refreshTokenUsed -totpSecret")
      .sort({ role: 1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Admin.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      admins,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      totalItems,
    },
  });
});

/**
 * GET /api/admin/admins/:id
 * Get single admin by ID
 */
export const getAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id).select(
    "-password -refreshToken -refreshTokenUsed -totpSecret",
  );
  if (!admin) {
    throw new AppError("Quản trị viên không tồn tại", 404);
  }
  res.json({ success: true, data: admin });
});

/**
 * POST /api/admin/admins
 * Create a new admin account (super_admin only)
 * Body: { username, email, password, role }
 */
export const createAdmin = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    throw new AppError("Vui lòng nhập đầy đủ thông tin (username, email, password)", 400);
  }

  // Check duplicate
  const existing = await Admin.findOne({
    $or: [{ email }, { username }],
  });
  if (existing) {
    throw new AppError(
      existing.email === email
        ? "Email đã được sử dụng"
        : "Tên đăng nhập đã tồn tại",
      409,
    );
  }

  const admin = await Admin.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role === "super_admin" ? "super_admin" : "admin",
  });

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "admin:create",
    resource: "admins",
    details: {
      targetId: admin._id,
      targetUsername: admin.username,
      targetEmail: admin.email,
      targetRole: admin.role,
    },
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    },
  });
});

/**
 * PUT /api/admin/admins/:id
 * Update admin info (username, email, role)
 * Super admin can update any admin; admin can only update themselves
 */
export const updateAdmin = asyncHandler(async (req, res) => {
  const { username, email, role, isActive } = req.body;
  const targetId = req.params.id;

  const admin = await Admin.findById(targetId);
  if (!admin) {
    throw new AppError("Quản trị viên không tồn tại", 404);
  }

  // Regular admin can only update themselves
  if (req.admin.role !== "super_admin" && req.admin._id.toString() !== targetId) {
    throw new AppError("Bạn không có quyền sửa người dùng khác", 403);
  }

  // Only super_admin can change role
  if (role !== undefined && req.admin.role !== "super_admin") {
    throw new AppError("Bạn không có quyền thay đổi vai trò", 403);
  }

  // Only super_admin can toggle active status
  if (isActive !== undefined && req.admin.role !== "super_admin") {
    throw new AppError("Bạn không có quyền thay đổi trạng thái", 403);
  }

  const updateData = {};
  if (username !== undefined) updateData.username = username.trim();
  if (email !== undefined) updateData.email = email.toLowerCase().trim();
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Check duplicate email/username if changed
  if (updateData.email || updateData.username) {
    const duplicateCheck = [];
    if (updateData.email) duplicateCheck.push({ email: updateData.email, _id: { $ne: targetId } });
    if (updateData.username) duplicateCheck.push({ username: updateData.username, _id: { $ne: targetId } });

    if (duplicateCheck.length > 0) {
      const existing = await Admin.findOne({ $or: duplicateCheck });
      if (existing) {
        throw new AppError(
          existing.email === (updateData.email || admin.email)
            ? "Email đã được sử dụng"
            : "Tên đăng nhập đã tồn tại",
          409,
        );
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError("Không có dữ liệu cập nhật", 400);
  }

  const updated = await Admin.findByIdAndUpdate(
    targetId,
    { $set: updateData },
    { new: true, runValidators: true },
  ).select("-password -refreshToken -refreshTokenUsed -totpSecret");

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "admin:update",
    resource: "admins",
    details: {
      targetId,
      targetUsername: updated.username,
      changes: Object.keys(updateData),
    },
    ip: req.ip,
  });

  res.json({ success: true, data: updated });
});

/**
 * DELETE /api/admin/admins/:id
 * Delete an admin account (super_admin only, cannot delete self)
 */
export const deleteAdmin = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  // Cannot delete yourself
  if (req.admin._id.toString() === targetId) {
    throw new AppError("Bạn không thể xoá chính mình", 400);
  }

  const admin = await Admin.findByIdAndDelete(targetId);
  if (!admin) {
    throw new AppError("Quản trị viên không tồn tại", 404);
  }

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "admin:delete",
    resource: "admins",
    details: {
      targetId,
      targetUsername: admin.username,
      targetEmail: admin.email,
    },
    ip: req.ip,
  });

  res.json({ success: true, message: "Đã xoá quản trị viên" });
});

/**
 * PATCH /api/admin/admins/:id/toggle-status
 * Toggle isActive status (super_admin only)
 */
export const toggleAdminStatus = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  // Cannot deactivate yourself
  if (req.admin._id.toString() === targetId) {
    throw new AppError("Bạn không thể vô hiệu hoá chính mình", 400);
  }

  const admin = await Admin.findById(targetId);
  if (!admin) {
    throw new AppError("Quản trị viên không tồn tại", 404);
  }

  admin.isActive = !admin.isActive;
  await admin.save();

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: admin.isActive ? "admin:activate" : "admin:deactivate",
    resource: "admins",
    details: {
      targetId,
      targetUsername: admin.username,
      targetEmail: admin.email,
    },
    ip: req.ip,
  });

  res.json({
    success: true,
    data: {
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    },
    message: admin.isActive
      ? "Đã kích hoạt quản trị viên"
      : "Đã vô hiệu hoá quản trị viên",
  });
});
