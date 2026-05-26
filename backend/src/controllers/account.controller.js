import Account from "../models/Account.model.js";
import Order from "../models/Order.model.js";
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

// ─── Compare ─────────────────────────────────────────────────────────────

export const compareAccounts = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 5) {
    throw new AppError("Vui lòng chọn từ 2 đến 5 tài khoản để so sánh", 400);
  }

  const accounts = await Account.find({
    _id: { $in: ids },
    isActive: true,
  }).select("-loginInfo");

  if (accounts.length !== ids.length) {
    throw new AppError("Một số tài khoản không tồn tại hoặc đã bị khoá", 404);
  }

  res.json({ success: true, data: { accounts } });
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
