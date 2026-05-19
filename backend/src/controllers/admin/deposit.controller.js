import { CardDeposit } from "../../models/client/deposits/CardDeposit.model";
import { BankDeposit } from "../../models/client/deposits/BankDeposit.model";
import {
  adaptBankDeposit,
  adaptCardDeposit,
} from "../../utils/deposit.adapter";

export const listDeposits = async (req, res) => {
  try {
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

      if (type === "card") {
        bankFilter._id = { $exists: false }; // Trick: làm bank query trả về rỗng
      } else if (type === "bank") {
        cardFilter._id = { $exists: false }; // Trick: làm card query trả về rỗng
      }

      const [cardDeposits, cardTotal, bankDeposits, bankTotal] =
        await Promise.all([
          CardDeposit.find(cardFilter)
            .populate("user username email")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
          CardDeposit.countDocuments(cardFilter),
          BankDeposit.find(bankFilter)
            .populate("user username email")
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

      return res.json({
        success: true,
        message: "Lấy danh sách giao dịch thành công",
        data: {
          deposits: paginatedDeposits,
          totalPages,
          currentPage: parseInt(page),
          totalItems,
        },
      });
    }
  } catch (error) {
    console.error("[listDeposits] Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách giao dịch",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
