import express from "express";
import { getAccountById, getAccounts } from "../controllers/account.controller.js";

const router = express.Router();

// Public routes
router.get("/", getAccounts);
router.get("/:id", getAccountById);

// Protected routes (Admin only - sẽ làm sau)
// router.post("/", protect, admin, createAccount);

export default router;
