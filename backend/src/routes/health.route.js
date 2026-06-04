import express from "express";
import { getHealth } from "../controllers/health.controller.js";

const router = express.Router();

// Health check — no auth required (for monitoring tools / load balancers)
router.get("/", getHealth);

// Also respond to HEAD requests (common for monitoring probes)
router.head("/", getHealth);

export default router;
