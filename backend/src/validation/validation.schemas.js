import { z } from "zod";

// ─── AUTH SCHEMAS ─────────────────────────────────────────────────────────

export const signUpSchema = z.object({
  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(30, "Tên đăng nhập tối đa 30 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Tên đăng nhập chỉ gồm chữ, số và dấu gạch dưới"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
  email: z.string().email("Email không hợp lệ").max(255),
});

export const signInSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập email hoặc tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z
    .string()
    .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
    .max(128),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

// ─── ORDER SCHEMAS ─────────────────────────────────────────────────────────

export const purchaseAccountSchema = z.object({
  discountCode: z.string().trim().max(50).optional(),
});

// ─── PAYMENT SCHEMAS ───────────────────────────────────────────────────────

export const createPayOSPurchaseSchema = z.object({
  accountId: z.string().min(1, "Thiếu mã tài khoản"),
  discountCode: z.string().trim().max(50).optional(),
});

export const createDepositInfoSchema = z.object({
  amount: z
    .number()
    .int("Số tiền phải là số nguyên")
    .min(10000, "Số tiền nạp tối thiểu 10,000đ")
    .max(100_000_000, "Số tiền nạp tối đa 100,000,000đ"),
  discountCode: z.string().trim().max(50).optional(),
});

export const submitCardDepositSchema = z.object({
  provider: z
    .string()
    .min(1, "Vui lòng chọn nhà mạng")
    .max(20, "Nhà mạng không hợp lệ"),
  serial: z
    .string()
    .min(1, "Vui lòng nhập serial thẻ")
    .max(50, "Serial thẻ không hợp lệ"),
  pin: z
    .string()
    .min(1, "Vui lòng nhập mã thẻ")
    .max(50, "Mã thẻ không hợp lệ"),
  amount: z
    .number()
    .int("Mệnh giá phải là số nguyên")
    .min(10000, "Mệnh giá tối thiểu 10,000đ")
    .max(1_000_000_000, "Mệnh giá quá lớn"),
  discountCode: z.string().trim().max(50).optional(),
});

// ─── ACCOUNT SCHEMAS (Admin) ───────────────────────────────────────────────

export const createAccountSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề").max(200),
  game: z.enum(
    ["lien-quan", "lien-minh", "valorant", "free-fire", "khac"],
    { message: "Game không hợp lệ" },
  ),
  price: z.number().min(0, "Giá không được âm").max(100_000_000),
  description: z.string().max(5000).optional().default(""),
  attributes: z.record(z.any()).optional().default({}),
  images: z.array(z.string().max(500)).max(20).optional().default([]),
  type: z.string().max(50).optional().default("standard"),
  loginInfo: z.object({
    username: z.string().min(1, "Vui lòng nhập tên đăng nhập").max(200),
    password: z.string().min(1, "Vui lòng nhập mật khẩu").max(200),
  }),
});

export const updateAccountSchema = z.object({
  title: z.string().max(200).optional(),
  game: z
    .enum(["lien-quan", "lien-minh", "valorant", "free-fire", "khac"])
    .optional(),
  price: z.number().min(0).max(100_000_000).optional(),
  description: z.string().max(5000).optional(),
  attributes: z.record(z.any()).optional(),
  images: z.array(z.string().max(500)).max(20).optional(),
  type: z.string().max(50).optional(),
  loginInfo: z
    .object({
      username: z.string().min(1).max(200).optional(),
      password: z.string().min(1).max(200).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

// ─── REVIEW SCHEMAS ────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  accountId: z.string().min(1, "Thiếu mã tài khoản"),
  orderId: z.string().min(1, "Thiếu mã đơn hàng"),
  rating: z
    .number()
    .int("Đánh giá phải là số nguyên")
    .min(1, "Đánh giá từ 1-5 sao")
    .max(5, "Đánh giá từ 1-5 sao"),
  comment: z.string().max(1000).optional().default(""),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

// ─── GIFTCODE SCHEMAS ──────────────────────────────────────────────────────

export const createGiftcodeSchema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã code").max(50),
  type: z.enum(["percent", "fixed"], { message: "Loại giảm giá không hợp lệ" }),
  value: z.number().min(0, "Giá trị giảm phải >= 0").max(1_000_000_000),
  minOrderAmount: z.number().min(0).optional().default(0),
  maxUses: z.number().int().min(1).optional().nullable().default(null),
  gameFilter: z.string().max(50).optional().nullable().default(null),
  expiresAt: z.string().datetime().optional().nullable().default(null),
});

export const updateGiftcodeSchema = z.object({
  type: z.enum(["percent", "fixed"]).optional(),
  value: z.number().min(0).max(1_000_000_000).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional().nullable(),
  gameFilter: z.string().max(50).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const validateGiftcodeSchema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã code").max(50),
  amount: z.number().min(0, "Số tiền không hợp lệ"),
  game: z.string().max(50).optional(),
});

// ─── ADMIN AUTH ────────────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const adminTwoFactorCodeSchema = z.object({
  totpCode: z
    .string()
    .min(6, "Mã xác thực phải có 6 chữ số")
    .max(6, "Mã xác thực phải có 6 chữ số")
    .regex(/^\d{6}$/, "Mã xác thực phải gồm 6 chữ số"),
});

export const adminTwoFactorDisableSchema = z.object({
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  totpCode: z
    .string()
    .min(6, "Mã xác thực phải có 6 chữ số")
    .max(6, "Mã xác thực phải có 6 chữ số")
    .regex(/^\d{6}$/, "Mã xác thực phải gồm 6 chữ số"),
});

export const adminTwoFactorVerifySchema = z.object({
  tempToken: z.string().min(1, "Thiếu mã tạm thời"),
  totpCode: z
    .string()
    .min(6, "Mã xác thực phải có 6 chữ số")
    .max(6, "Mã xác thực phải có 6 chữ số")
    .regex(/^\d{6}$/, "Mã xác thực phải gồm 6 chữ số"),
});

// ─── ADMIN REVIEW MODERATION ───────────────────────────────────────────────

export const moderateReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"], {
    message: "Trạng thái duyệt không hợp lệ",
  }),
});

// ─── ADMIN DEPOSIT STATUS ────────────────────────────────────────────────────

export const updateDepositStatusSchema = z.object({
  status: z.enum(["pending", "completed", "failed", "expired"], {
    message: "Trạng thái nạp tiền không hợp lệ",
  }),
  note: z.string().max(500).optional(),
});

// ─── FORGOT / RESET PASSWORD ────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
});

// ─── ID PARAM SCHEMA ───────────────────────────────────────────────────────

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "ID không hợp lệ");
