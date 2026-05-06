import express from "express";
import { protectedRoute } from "../middlewares/client/auth.middleware.js";
import { getMe } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/me", protectedRoute, getMe);

export default router;
