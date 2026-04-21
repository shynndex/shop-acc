import jwt from "jsonwebtoken";
import AdminModel from "../../models/admin/Admin.model";
import Admin from "../../models/admin/Admin.model";

export const adminProtect = async (req, res, next) => {
  const token = req.cookies?.admin_token;
  if (!token)
    return res.status(401).json({ success: false, message: "Chưa đăng nhập" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    req.admin = await Admin.findById(decoded.id).select("-password");

    if (!req.admin || !req.admin.isActive) {
      res.clearCookie("admin_token", { path: "/api/admin" });
      return res.status(403).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị khóa",
      });
    }
    next();
  } catch (error) {
    res.clearCookie("admin_token", { path: "/api/admin" });
    return res
      .status(401)
      .json({ success: false, message: "Token không hợp lệ" });
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Bạn không có quyền truy cập chức năng này",
        });
    }
    next();
  };
