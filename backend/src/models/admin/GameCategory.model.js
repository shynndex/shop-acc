import mongoose from "mongoose";

const CategoryItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    typeValue: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    priceFrom: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const GameCategorySchema = new mongoose.Schema(
  {
    gameSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    gameName: { type: String, required: true, trim: true },
    gameIcon: { type: String, default: "🎮" },
    iconType: {
      type: String,
      enum: ["emoji", "image"],
      default: "emoji",
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    categories: [CategoryItemSchema],
  },
  {
    timestamps: true,
  },
);

GameCategorySchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

GameCategorySchema.set("toObject", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const GameCategory = mongoose.model("GameCategory", GameCategorySchema);
export default GameCategory;
