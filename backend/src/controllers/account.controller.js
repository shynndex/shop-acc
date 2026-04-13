import Account from "../models/Account.model.js";

export const getAccounts = async (req, res) => {
  try {
    const { game, type, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const query = { status: "available" };

    if (game) query.game = game;

    if (type) query.type = type;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const accounts = await Account.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * Number(limit));

    const total = await Account.countDocuments(query);

    res.status(200).json({
      accounts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tài khoản getAccounts:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    res.status(200).json({ account });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin tài khoản getAccountById:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
