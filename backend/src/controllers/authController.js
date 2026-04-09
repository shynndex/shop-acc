import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
const ACCESS_TOKEN_SECRET_TTL = "30m";
import crypto from "crypto";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000 * 60;
export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Không thể thiếu username , password, email , firstName và lastName",
      });
    }

    //Ktra username ton tai chua
    const duplicate = await User.findOne({ username });
    if (duplicate) {
      res.status(409).json({ message: "Username đã tồn tại" });
    }
    //ma hoa password
    const hashedPassword = await bcrypt.hash(password, 10);

    //tao user moi
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
    });
    res.status(201).json({ message: "Tạo tài khoản thành công" });
  } catch (error) {
    console.log("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};
export const signIn = async (req, res) => {
  try {
    //lay du lieu tu body
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Thieu du lieu" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Sai username hoac password" });
    }
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword); //ktra password
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Sai username hoac password" });
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
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });
    return res
      .status(200)
      .json({ message: `User ${user.displayName} da login`, accessToken });
  } catch (error) {
    console.log("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};
export const signOut = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await Session.deleteOne({ refreshToken: token });
      res.clearCookie("refreshToken");
    }
    return res.sendStatus(204);
  } catch (error) {
    console.log("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};
//54
