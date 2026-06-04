import express from "express";
import {
  getAccountById,
  getAccounts,
  getFilterOptions,
  getSuggestions,
  getAccountsByGame,
  getTopDepositors,
} from "../controllers/account.controller.js";

const router = express.Router();

// Public routes (GET endpoints are read-only — low risk)
router.get("/", getAccounts);
router.get("/by-game", getAccountsByGame);
router.get("/top-depositors", getTopDepositors);
router.get("/filters", getFilterOptions);
router.get("/suggestions", getSuggestions);
router.get("/:id", getAccountById);

export default router;
