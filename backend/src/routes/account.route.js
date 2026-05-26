import express from "express";
import {
  getAccountById,
  getAccounts,
  compareAccounts,
  getFilterOptions,
  getSuggestions,
} from "../controllers/account.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { compareAccountsSchema } from "../validation/validation.schemas.js";

const router = express.Router();

// Public routes (GET endpoints are read-only — low risk)
router.get("/", getAccounts);
router.get("/filters", getFilterOptions);
router.get("/suggestions", getSuggestions);
router.get("/:id", getAccountById);

// POST endpoints: validate input
router.post("/compare", validate(compareAccountsSchema), compareAccounts);

export default router;
