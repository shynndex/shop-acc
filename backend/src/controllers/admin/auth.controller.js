import Admin from "../../models/admin/Admin.model";
import { getCookieOptions } from "../../utils/cookie.config";

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_ADMIN_SECRET,
    { expiresIn: "15m" },
  );
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin || !(await admin.matchPassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    if (!admin.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Tài khoản đã bị khóa" });
    }

    admin.lastLogin = new Date();
    admin.loginIP = req.ip;
    await admin.save();

    const token = generateToken(admin);
    res.cookie("admin_token", token, getCookieOptions());

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập admin", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("admin_token", { path: "/api/admin" });
  res.json({ success: true, message: "Đăng xuất thành công" });
};

export const getMe = (req, res) => {
  if (!req.admin) {
    return res
      .status(401)
      .json({ success: false, message: "Người dùng không tồn tại" });
  }
  res.json({ success: true, admin: req.admin });
};
