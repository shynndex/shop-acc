import BankAccount from "../../models/admin/BankAccount.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";

/**
 * GET /api/admin/banks
 * List all bank accounts, sorted by isActive desc + name asc
 */
export const listBankAccounts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { accountNumber: { $regex: search, $options: "i" } },
      { accountName: { $regex: search, $options: "i" } },
    ];
  }

  const [banks, totalItems] = await Promise.all([
    BankAccount.find(filter)
      .sort({ isActive: -1, name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    BankAccount.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      banks,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      totalItems,
    },
  });
});

/**
 * GET /api/admin/banks/:id
 * Get single bank account by ID
 */
export const getBankAccount = asyncHandler(async (req, res) => {
  const bank = await BankAccount.findById(req.params.id);
  if (!bank) {
    throw new AppError("Ngân hàng không tồn tại", 404);
  }
  res.json({ success: true, data: bank });
});

/**
 * POST /api/admin/banks
 * Create a new bank account
 * Body: { name, accountNumber, accountName, qrImageUrl }
 */
export const createBankAccount = asyncHandler(async (req, res) => {
  const { name, accountNumber, accountName, qrImageUrl } = req.body;

  if (!name || !accountNumber || !accountName) {
    throw new AppError("Vui lòng nhập đầy đủ thông tin (name, accountNumber, accountName)", 400);
  }

  const bank = await BankAccount.create({
    name: name.trim(),
    accountNumber: accountNumber.trim(),
    accountName: accountName.trim(),
    qrImageUrl: qrImageUrl?.trim() || "",
    isActive: false, // Mặc định not active, admin chọn sau
  });

  res.status(201).json({ success: true, data: bank });
});

/**
 * PUT /api/admin/banks/:id
 * Update bank account info
 */
export const updateBankAccount = asyncHandler(async (req, res) => {
  const { name, accountNumber, accountName, qrImageUrl } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (accountNumber !== undefined) updateData.accountNumber = accountNumber.trim();
  if (accountName !== undefined) updateData.accountName = accountName.trim();
  if (qrImageUrl !== undefined) updateData.qrImageUrl = qrImageUrl.trim();

  if (Object.keys(updateData).length === 0) {
    throw new AppError("Không có dữ liệu cập nhật", 400);
  }

  const bank = await BankAccount.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!bank) {
    throw new AppError("Ngân hàng không tồn tại", 404);
  }

  res.json({ success: true, data: bank });
});

/**
 * DELETE /api/admin/banks/:id
 * Delete a bank account
 */
export const deleteBankAccount = asyncHandler(async (req, res) => {
  const bank = await BankAccount.findByIdAndDelete(req.params.id);
  if (!bank) {
    throw new AppError("Ngân hàng không tồn tại", 404);
  }
  res.json({ success: true, message: "Đã xóa ngân hàng" });
});

/**
 * PATCH /api/admin/banks/:id/toggle-active
 * Toggle isActive status (set one bank as active, deactivate others)
 */
export const toggleBankActive = asyncHandler(async (req, res) => {
  const bank = await BankAccount.findById(req.params.id);
  if (!bank) {
    throw new AppError("Ngân hàng không tồn tại", 404);
  }

  // Toggle active status
  const newActive = !bank.isActive;

  bank.isActive = newActive;
  await bank.save();
  // Model pre-save hook tự động deactivate các bank khác

  res.json({ success: true, data: bank });
});
