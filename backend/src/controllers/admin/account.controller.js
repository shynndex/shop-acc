// ============================================================================
// LIST ACCOUNTS
// GET /api/admin/accounts
// ============================================================================

import Account from "../../models/Account.model.js";


export const getAccounts = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tài khoản getAccounts:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách tài khoản" });
  }
};

// ============================================================================
//  GET ACCOUNT BY ID
// GET /api/admin/accounts/:id
// ============================================================================

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id).select("+loginInfo");

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Tài khoản không tồn tại" });
    }

    res.json({ success: true, data: { account } });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin tài khoản getAccountById:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy thông tin tài khoản" });
  }
};

// ============================================================================
// CREATE ACCOUNT
// POST /api/admin/accounts
// ============================================================================

export const createAccount = async (req, res) => {
  try {
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
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
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

    res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công",
      data: { account },
    });
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản createAccount:", error);
    res.status(500).json({ success: false, message: "Lỗi khi tạo tài khoản" });
  }
};

// ============================================================================
// UPDATE ACCOUNT
// PUT /api/admin/accounts/:id
// ============================================================================

export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Không cho phép update trực tiếp owner nếu không phải super_admin hoặc admin
    if (req.admin.role !== "admin" && req.admin.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác này",
      });
    }

    const account = await Account.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("+loginInfo");

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Tài khoản không tồn tại" });
    }

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: { account },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật tài khoản updateAccount:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật tài khoản" });
  }
};

// ============================================================================
// TOGGLE STATUS (Hide/Show public)
// PATCH /api/admin/accounts/:id/status
// ============================================================================

export const toggleAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const account = await Account.findByIdAndUpdate(
      id,
      { $set: { isActive: isActive !== false } },
      { new: true },
    );

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Tài khoản không tồn tại" });
    }
    res.json({
      success: true,
      message: isActive ? "Đã hiển thị tài khoản" : "Đã ẩn tài khoản",
      data: { account },
    });
  } catch (error) {
    console.error(
      "Lỗi khi chuyển đổi trạng thái tài khoản toggleAccountStatus:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Lỗi khi chuyển đổi trạng thái tài khoản",
    });
  }
};

// ============================================================================
//  DELETE ACCOUNT (Admin only)
// DELETE /api/admin/accounts/:id
// ============================================================================

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // Không cho phép xóa tài khoản nếu không phải admin
    if (req.admin.role !== "admin" && req.admin.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác này",
      });
    }

    const account = await Account.findByIdAndDelete(id);

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Tài khoản không tồn tại" });
    }

    res.json({
      success: true,
      message: "Xóa tài khoản thành công",
      data: { account },
    });
  } catch (error) {
    console.error("Lỗi khi xóa tài khoản deleteAccount:", error);
    res.status(500).json({ success: false, message: "Lỗi khi xóa tài khoản" });
  }
};
