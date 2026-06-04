import Account from "../models/Account.model.js";
import Order from "../models/Order.model.js";
import BankDeposit from "../models/client/deposits/BankDeposit.model.js";
import CardDeposit from "../models/client/deposits/CardDeposit.model.js";
import User from "../models/client/User.model.js";
import GameCategory from "../models/admin/GameCategory.model.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";

// ─── Advanced Search / Attribute Filtering ─────────────────────────────────

export const getAccounts = asyncHandler(async (req, res) => {
  const {
    game, type, minPrice, maxPrice,
    rank, minSkins, minHeroes, search,
    sortBy,
    page = 1, limit = 10,
  } = req.query;

  const query = { isActive: true, isSold: false };

  if (game) query.game = game;
  if (type) query.type = type;

  // Price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Attribute filters (advanced search) — dùng $and để các điều kiện độc lập
  const andConditions = [];

  if (rank) {
    andConditions.push({ "attributes.rank": { $regex: rank, $options: "i" } });
  }

  if (minSkins) {
    andConditions.push({
      $or: [
        { "attributes.skins": { $gte: Number(minSkins) } },
        { "attributes.skinCount": { $gte: Number(minSkins) } },
      ],
    });
  }

  if (minHeroes) {
    andConditions.push({
      $or: [
        { "attributes.heroes": { $gte: Number(minHeroes) } },
        { "attributes.heroCount": { $gte: Number(minHeroes) } },
      ],
    });
  }

  // Text search (title or code)
  if (search) {
    andConditions.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { "attributes.code": { $regex: search, $options: "i" } },
      ],
    });
  }

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  // Sorting
  let sort = { createdAt: -1 };
  if (sortBy === "price_asc") sort = { price: 1 };
  else if (sortBy === "price_desc") sort = { price: -1 };

  const accounts = await Account.find(query)
    .sort(sort)
    .limit(Number(limit))
    .skip((page - 1) * Number(limit));

  const total = await Account.countDocuments(query);

  res.status(200).json({
    accounts,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    totalItems: total,
  });
});

// ─── Get Filter Options ────────────────────────────────────────────────────

export const getFilterOptions = asyncHandler(async (req, res) => {
  const { game } = req.query;

  const match = { isActive: true, isSold: false };
  if (game) match.game = game;

  const accounts = await Account.find(match)
    .select("attributes price game")
    .lean();

  // Collect unique attribute values
  const rankSet = new Set();
  let minSkinCount = Infinity;
  let maxSkinCount = 0;
  let minHeroCount = Infinity;
  let maxHeroCount = 0;
  let minPriceVal = Infinity;
  let maxPriceVal = 0;

  for (const acc of accounts) {
    if (acc.attributes?.rank) rankSet.add(acc.attributes.rank);

    const skins = acc.attributes?.skins || acc.attributes?.skinCount || 0;
    if (skins > 0) {
      minSkinCount = Math.min(minSkinCount, skins);
      maxSkinCount = Math.max(maxSkinCount, skins);
    }

    const heroes = acc.attributes?.heroes || acc.attributes?.heroCount || 0;
    if (heroes > 0) {
      minHeroCount = Math.min(minHeroCount, heroes);
      maxHeroCount = Math.max(maxHeroCount, heroes);
    }

    if (acc.price > 0) {
      minPriceVal = Math.min(minPriceVal, acc.price);
      maxPriceVal = Math.max(maxPriceVal, acc.price);
    }
  }

  const ranks = Array.from(rankSet).sort();

  res.json({
    success: true,
    data: {
      ranks,
      skinRange: minSkinCount !== Infinity
        ? { min: minSkinCount, max: maxSkinCount }
        : null,
      heroRange: minHeroCount !== Infinity
        ? { min: minHeroCount, max: maxHeroCount }
        : null,
      priceRange: minPriceVal !== Infinity
        ? { min: minPriceVal, max: maxPriceVal }
        : null,
    },
  });
});

// ─── Get Account By ID ────────────────────────────────────────────────────

export const getAccountById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const account = await Account.findById(id);

  if (!account) {
    throw new AppError("Tài khoản không tồn tại", 404);
  }

  res.status(200).json({ account });
});

// ─── Accounts By Game (for homepage sections) ───────────────────────────

export const getAccountsByGame = asyncHandler(async (req, res) => {
  const { limit = 4 } = req.query;
  const limitNum = Math.min(Number(limit) || 4, 8);

  // Get active games sorted by sortOrder
  const games = await GameCategory.find({ isActive: true })
    .sort({ sortOrder: 1, gameName: 1 })
    .lean();

  // For each game, fetch top available accounts
  const sections = [];
  for (const game of games) {
    let accounts = await Account.find({
      game: game.gameSlug,
      isActive: true,
      isSold: false,
    })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .select("-loginInfo")
      .lean();

    // Map _id to id (lean() bypasses toJSON transform)
    accounts = accounts.map((acc) => ({
      ...acc,
      id: acc._id.toString(),
    }));

    if (accounts.length > 0) {
      sections.push({
        gameSlug: game.gameSlug,
        gameName: game.gameName,
        gameIcon: game.gameIcon,
        accounts,
      });
    }
  }

  res.json({ success: true, data: { sections } });
});

// ─── Top Depositors (homepage podium) ───────────────────────────────────

export const getTopDepositors = asyncHandler(async (req, res) => {
  const { limit = 3 } = req.query;
  const limitNum = Math.min(Number(limit) || 3, 10);

  // Aggregate total deposits from both BankDeposit (PAID) and CardDeposit (SUCCESS)
  const [bankDeposits, cardDeposits] = await Promise.all([
    BankDeposit.aggregate([
      { $match: { status: "PAID", type: "deposit" } },
      { $group: { _id: "$user", total: { $sum: "$amount" } } },
    ]),
    CardDeposit.aggregate([
      { $match: { status: "SUCCESS" } },
      { $group: { _id: "$user", total: { $sum: "$receivedAmount" } } },
    ]),
  ]);

  // Merge totals by user
  const totalsMap = new Map();
  const addTotals = (deposits) => {
    for (const d of deposits) {
      const key = d._id?.toString();
      if (!key) continue;
      totalsMap.set(key, (totalsMap.get(key) || 0) + d.total);
    }
  };
  addTotals(bankDeposits);
  addTotals(cardDeposits);

  // Sort by total descending, take top N
  const sorted = Array.from(totalsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limitNum);

  if (sorted.length === 0) {
    return res.json({ success: true, data: { depositors: [] } });
  }

  // Fetch user info
  const userIds = sorted.map(([id]) => id);
  const users = await User.find({ _id: { $in: userIds } })
    .select("displayName avatarUrl balance")
    .lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const depositors = sorted.map(([userId, total], index) => {
    const user = userMap.get(userId);
    return {
      rank: index + 1,
      userId,
      displayName: user?.displayName || "Ẩn danh",
      avatarUrl: user?.avatarUrl || null,
      totalDeposited: total,
    };
  });

  res.json({ success: true, data: { depositors } });
});

// ─── Suggestions ──────────────────────────────────────────────────────────

export const getSuggestions = asyncHandler(async (req, res) => {
  const { accountId, type = "related", limit: queryLimit = 6 } = req.query;

  if (type === "popular") {
    // Popular: accounts that have been ordered the most (cache-friendly)
    const popular = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$account", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: "accounts", localField: "_id", foreignField: "_id", as: "account" } },
      { $unwind: "$account" },
      { $match: { "account.isActive": true, "account.isSold": false } },
      { $limit: Number(queryLimit) },
      { $replaceRoot: { newRoot: "$account" } },
    ]);

    return res.json({ success: true, data: { accounts: popular } });
  }

  // Related: same game, same type, exclude current account
  if (type === "related" && accountId) {
    const current = await Account.findById(accountId).lean();
    if (!current) {
      return res.json({ success: true, data: { accounts: [] } });
    }

    const related = await Account.find({
      _id: { $ne: accountId },
      game: current.game,
      type: current.type,
      isActive: true,
      isSold: false,
    })
      .limit(Number(queryLimit))
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { accounts: related } });
  }

  // Default: newest accounts
  const newest = await Account.find({ isActive: true, isSold: false })
    .sort({ createdAt: -1 })
    .limit(Number(queryLimit));

  res.json({ success: true, data: { accounts: newest } });
});
