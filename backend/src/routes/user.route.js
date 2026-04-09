import express from "express";
import { authMe } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protectedRoute, getUserProfile);

export default router;
