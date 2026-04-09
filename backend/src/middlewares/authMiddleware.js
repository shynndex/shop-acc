import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = (req, res, next) => {
  try {
    //lay token tu header
    const authHeader = req.headers["authorization"];
    //lay phan token
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Khong co token" });
    }
    //xac minh token 3 tham so
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, decodedUser) => {
        if (err) {
          console.error(error);
          return res
            .status(403)
            .json({ message: "Access token het han hoac khong dung" });
        }
        //tim user
        const user = await User.findById(decodedUser.userId).select(
          "-hashedPassword"
        );
        if (!user) {
          return res.status(404).json({ message: "Khong tim thay user" });
        }
        req.user = user;
        next();
      }
    );
  } catch (error) {
    console.log("Loi khi xac minh JWT trong authMiddleware", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};
//53
