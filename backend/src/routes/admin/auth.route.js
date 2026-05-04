import express from "express";
import {
  getMe,
  login,
  logout,
} from "../../controllers/admin/auth.controller.js";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";

const router = express.Router();

router.use(cookieParser()); // Bắt buộc để đọc cookie
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", adminProtect, getMe);

export default router;
