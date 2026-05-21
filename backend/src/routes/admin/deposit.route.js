import express from "express";

const router = express.Router();

router.use(adminProtect);

router.get("/", listDeposits); // GET /api/admin/deposits
router.get("/:id", getDepositById); // GET /api/admin/deposits/:id
router.patch("/:id/status", updateDepositStatus); // PATCH /api/admin/deposits/:id/status
router.get("/export", exportDepositsCsv); // GET /api/admin/deposits/export


export default router;