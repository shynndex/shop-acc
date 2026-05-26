import CardDeposit from "../../models/client/deposits/CardDeposit.model.js";
import BankDeposit from "../../models/client/deposits/BankDeposit.model.js";
import {
  adaptBankDeposit,
  adaptCardDeposit,
} from "../../utils/deposit.adapter.js";
import User from "../../models/client/User.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { logBalanceChange } from "../../services/auditLogger.service.js";
import { logAdminAction } from "../../services/adminAudit.service.js";

export const listDeposits = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 15,
    status,
    type,
    search,
    dateFrom,
    dateTo,
  } = req.query;

  const skip = (page - 1) * limit;
  const sort = { createdAt: -1 };

  const cardFilter = {};
  const bankFilter = {};

  if (status) {
    cardFilter.status = status;
    bankFilter.status = status;
  }

  if (dateFrom || dateTo) {
    const dateRange = {};
    if (dateFrom) dateRange.$gte = new Date(dateFrom);
    if (dateTo) dateRange.$lte = new Date(dateTo);
    cardFilter.createdAt = dateRange;
    bankFilter.createdAt = dateRange;
  }

  if (type === "card") {
    bankFilter._id = { $exists: false }; // Trick: làm bank query trả về rỗng
  } else if (type === "bank") {
    cardFilter._id = { $exists: false }; // Trick: làm card query trả về rỗng
  }

  // Search by username/email → tìm userIds trước
  let userIds = null;
  if (search) {
    const users = await User.find({
      $or: [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    userIds = users.map((user) => user._id);

    if (userIds.length > 0) {
      cardFilter.user = { $in: userIds };
      bankFilter.user = { $in: userIds };
    } else {
      return res.json({
        success: true,
        message: "Không tìm thấy kết quả",
        data: {
          deposits: [],
          totalPages: 0,
          currentPage: parseInt(page),
          totalItems: 0,
        },
      });
    }
  }

  const [cardDeposits, cardTotal, bankDeposits, bankTotal] =
    await Promise.all([
      CardDeposit.find(cardFilter)
        .populate("user", "username email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      CardDeposit.countDocuments(cardFilter),
      BankDeposit.find(bankFilter)
        .populate("user", "username email")
        .populate("bank", "bankName accountNumber accountHolder")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      BankDeposit.countDocuments(bankFilter),
    ]);

  const adaptedCard = cardDeposits.map(adaptCardDeposit);
  const adaptedBank = bankDeposits.map(adaptBankDeposit);
  const allDeposits = [...adaptedCard, ...adaptedBank].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const paginatedDeposits = allDeposits.slice(0, limit);
  const totalItems = cardTotal + bankTotal;
  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    success: true,
    message: "Lấy danh sách giao dịch thành công",
    data: {
      deposits: paginatedDeposits,
      totalPages,
      currentPage: parseInt(page),
      totalItems,
    },
  });
});

export const getDepositById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let deposit = await CardDeposit.findById(id).populate(
    "user",
    "username email balance",
  );

  // Try CardDeposit first
  if (deposit) {
    return res.json({
      success: true,
      message: "Lấy thông tin giao dịch thành công",
      data: { deposit: adaptCardDeposit(deposit) },
    });
  }

  deposit = await BankDeposit.findById(id)
    .populate("user", "username email balance")
    .populate("bank", "bankName accountNumber accountHolder");

  if (deposit) {
    return res.json({
      success: true,
      message: "Lấy thông tin giao dịch thành công",
      data: { deposit: adaptBankDeposit(deposit) },
    });
  }

  throw new AppError("Không tìm thấy giao dịch", 404);
});

export const updateDepositStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  const validTransitions = {
    PENDING: ["SUCCESS", "FAILED", "CANCELLED"],
    // PAID chỉ cho bank, SUCCESS chỉ cho card
  };

  // Try CardDeposit first
  let deposit = await CardDeposit.findById(id);
  let isCard = true;

  if (!deposit) {
    // Try BankDeposit
    deposit = await BankDeposit.findById(id);
    isCard = false;
  }

  if (!deposit) {
    throw new AppError("Không tìm thấy giao dịch", 404);
  }

  if (!validTransitions[deposit.status]?.includes(status)) {
    throw new AppError(
      `Không thể chuyển từ ${deposit.status} sang ${status}`,
      400,
    );
  }

  // Nếu SUCCESS/PAID → cộng balance cho user
  if (status === "SUCCESS" || status === "PAID") {
    const amountToAdd = isCard ? deposit.receivedAmount : deposit.amount;
    const updatedUser = await User.findByIdAndUpdate(
      deposit.user,
      { $inc: { balance: amountToAdd } },
      { new: true, select: "balance displayName username" },
    );

    // ── Audit log ───────────────────────────────────────────────
    if (updatedUser) {
      logBalanceChange({
        userId: deposit.user,
        userName: updatedUser.displayName || updatedUser.username,
        type: "admin_adjust",
        amount: amountToAdd,
        balanceBefore: updatedUser.balance - amountToAdd,
        balanceAfter: updatedUser.balance,
        reference: deposit._id,
        note: `Admin cập nhật deposit từ ${deposit.status} → ${status}${adminNote ? `: ${adminNote}` : ""}`,
        ip: req.ip,
      });
    }
  }

  deposit.status = status;
  if (adminNote) deposit.adminNote = adminNote;

  await deposit.save();

  const adapted = isCard
    ? adaptCardDeposit(deposit)
    : adaptBankDeposit(deposit);

  // ── Admin action audit ──────────────────────────────────────
  const actionMap = {
    SUCCESS: "deposit:approve",
    FAILED: "deposit:reject",
    CANCELLED: "deposit:cancel",
  };
  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: actionMap[status] || `deposit:${status.toLowerCase()}`,
    resource: "deposit",
    resourceId: deposit._id,
    details: {
      fromStatus: deposit.status,
      toStatus: status,
      type: isCard ? "card" : "bank",
      amount: isCard ? deposit.receivedAmount : deposit.amount,
      adminNote: adminNote || "",
    },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: `Đã cập nhật trạng thái thành ${status}`,
    data: { deposit: adapted },
  });
});

export const exportDepositsCsv = asyncHandler(async (req, res) => {
  const { status, type, dateFrom, dateTo } = req.query;
  const { createObjectWriter } = await import("csv-writer"); // Dynamic import để tránh bundle lớn

  // Build filters (giống listDeposits)
  const cardFilter = {};
  const bankFilter = {};
  if (status) {
    cardFilter.status = status;
    bankFilter.status = status;
  }
  if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) range.$gte = new Date(dateFrom);
    if (dateTo) range.$lte = new Date(dateTo);
    cardFilter.createdAt = range;
    bankFilter.createdAt = range;
  }
  if (type === "card") bankFilter._id = { $exists: false };
  if (type === "bank") cardFilter._id = { $exists: false };

  // Fetch all (no pagination for export)
  const [cardDocs, bankDocs] = await Promise.all([
    CardDeposit.find(cardFilter).populate("user", "username email").lean(),
    BankDeposit.find(bankFilter)
      .populate("user", "username email")
      .populate("bank", "bankName accountNumber")
      .lean(),
  ]);

  // Adapt + merge
  const allRows = [
    ...cardDocs.map(adaptCardDeposit),
    ...bankDocs.map(adaptBankDeposit),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // CSV headers
  const csvWriter = createObjectWriter({
    path: `/tmp/deposits-${Date.now()}.csv`,
    header: [
      { id: "_id", title: "ID" },
      { id: "userUsername", title: "Username" },
      { id: "userEmail", title: "Email" },
      { id: "type", title: "Loại" },
      { id: "amount", title: "Số tiền (đ)" },
      { id: "fee", title: "Phí (đ)" },
      { id: "status", title: "Trạng thái" },
      { id: "bankInfo.bankName", title: "Ngân hàng" },
      { id: "bankInfo.referenceCode", title: "Mã GD" },
      { id: "cardInfo.provider", title: "Nhà mạng" },
      { id: "cardInfo.serial", title: "Serial" },
      { id: "adminNote", title: "Ghi chú admin" },
      { id: "createdAt", title: "Thời gian" },
    ],
  });

  await csvWriter.writeRecords(allRows);

  // Send file
  const fs = await import("fs");
  const filePath = csvWriter.path;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="deposits-${new Date().toISOString().split("T")[0]}.csv"`,
  );

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);

  stream.on("end", () => {
    fs.unlinkSync(filePath); // Cleanup
  });
});
