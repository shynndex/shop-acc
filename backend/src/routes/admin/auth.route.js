import express from "express";
import {
  getMe,
  login,
  logout,
} from "../../controllers/admin/auth.controller.js";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { adminLoginSchema } from "../../validation/validation.schemas.js";
import { strictLimiter } from "../../middlewares/rateLimiter.middleware.js";
import cookieParser from "cookie-parser";

const router = express.Router();

router.use(cookieParser()); // Bắt buộc để đọc cookie
router.post("/login", strictLimiter, validate(adminLoginSchema), login);
router.post("/logout", logout);

router.get("/me", adminProtect, getMe);

export default router;
