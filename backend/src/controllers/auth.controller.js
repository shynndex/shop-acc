import bcrypt from "bcrypt";
import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import Session from "../models/Session.model.js";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET_TTL = "30m";

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      res.status(409).json({ message: "Tên đăng nhập hoặc email đã tồn tại" });
      return;
    }

    await User.create({
      username,
      password,
      email,
      displayName: `${firstName} ${lastName}`,
    });

    res.status(201).json({ message: "Tạo tài khoản thành công" });
  } catch (error) {
    console.log("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const user = await User.findOne({ username }).select("+hashedPassword");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Sai tên đăng nhập hoặc password" });
    }

    const passwordCorrect = await user.comparePassword(password);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "Sai tên đăng nhập hoặc password" });
    }
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_SECRET_TTL },
    );
    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: REFRESH_TOKEN_TTL,
    });
    return res.status(200).json({
      message: `User ${user.displayName} đã đăng nhập thành công`,
      accessToken,
    });
  } catch (error) {
    console.log("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await Session.deleteMany({
        $or: [{ refreshToken: token }, { userId: req.user?.id }],
      });
      res.clearCookie("refreshToken",{path:"/"});
    }
    return res.sendStatus(204);
  } catch (error) {
    console.log("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      return res.status(401).json({ message: "Không tìm thấy token làm mới" });
    }

    const session = await Session.findOne({ refreshToken: oldRefreshToken });
    if (!session) {
      //  Token không tồn tại → có thể bị tấn công → xóa cookie để bảo vệ
      res.clearCookie("refreshToken", { path: "/" });
      return res.status(401).json({ message: "Token làm mới không hợp lệ" });
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteMany({ _id: session._id }); // dọn session hết hạn
      res.clearCookie("refreshToken", { path: "/" });
      return res.status(401).json({ message: "Token làm mới đã hết hạn" });
    }

    const newRefreshToken = crypto.randomBytes(64).toString("hex");

    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: REFRESH_TOKEN_TTL,
      path: "/",
    });

    const accessToken = jwt.sign(
      { userId: session.userId.toString() },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_SECRET_TTL },
    );

    return res.json({ accessToken });
  } catch (error) {
    console.log("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
