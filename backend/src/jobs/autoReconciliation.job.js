/**
 * AutoReconciliation Job
 *
 * Runs every 5 minutes and automatically resolves stale deposit transactions:
 *   1. Bank deposits stuck in PENDING for > 60 minutes → auto-cancelled
 *   2. Card deposits stuck in PENDING for > 60 minutes → auto-failed
 *
 * Each action is:
 *   - Logged to AuditLog (as system, using the first available admin account)
 *   - Logged to console with details
 *   - Sent via Telegram for critical amounts (>= 500,000đ)
 *
 * This is a safety net that ensures no deposit is left in limbo indefinitely
 * if the payment provider callback is lost or the admin misses it.
 */
import BankDeposit from "../models/client/deposits/BankDeposit.model.js";
import CardDeposit from "../models/client/deposits/CardDeposit.model.js";
import Admin from "../models/admin/Admin.model.js";
import { logAdminAction } from "../services/adminAudit.service.js";
import { sendTelegramMessage } from "../services/telegram.service.js";

const INTERVAL_MS = 300_000; // Check every 5 minutes
const STALE_THRESHOLD_MINUTES = 60; // PENDING older than this → auto-resolve

let intervalHandle = null;
let systemAdminId = null;
let systemAdminName = "";

// ── Cached system admin lookup ──────────────────────────────────

async function ensureSystemAdmin() {
  if (systemAdminId) return;
  try {
    const admin = await Admin.findOne({ role: "super_admin" })
      .select("_id username")
      .lean();
    if (admin) {
      systemAdminId = admin._id;
      systemAdminName = admin.username || "Hệ thống";
    } else {
      // Fallback: any admin
      const fallback = await Admin.findOne({}).select("_id username").lean();
      if (fallback) {
        systemAdminId = fallback._id;
        systemAdminName = fallback.username || "Hệ thống";
      }
    }
  } catch (err) {
    console.error("[AutoRecon] Failed to look up system admin:", err.message);
  }
}

// ── Format VND ──────────────────────────────────────────────────

function formatVND(amount) {
  return (amount || 0).toLocaleString("vi-VN");
}

// ── Bank deposit auto-cancel ────────────────────────────────────

async function resolveStaleBankDeposits() {
  const threshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

  const staleDeposits = await BankDeposit.find({
    status: "PENDING",
    createdAt: { $lte: threshold },
  })
    .populate("user", "username displayName email")
    .limit(200)
    .lean();

  if (staleDeposits.length === 0) return [];

  const results = [];

  for (const deposit of staleDeposits) {
    try {
      const adminNote = deposit.adminNote
        ? `${deposit.adminNote} | Auto-cancelled after ${STALE_THRESHOLD_MINUTES}m`
        : `Auto-cancelled after ${STALE_THRESHOLD_MINUTES}m`;

      const result = await BankDeposit.updateOne(
        { _id: deposit._id, status: "PENDING" }, // CAS: only if still PENDING
        {
          $set: {
            status: "CANCELLED",
            adminNote,
          },
        },
      );

      // CAS miss — admin already resolved this deposit
      if (result.modifiedCount === 0) continue;

      // Audit log
      if (systemAdminId) {
        logAdminAction({
          adminId: systemAdminId,
          adminName: systemAdminName,
          action: "deposit:cancel",
          resource: "deposit",
          resourceId: deposit._id,
          details: {
            type: "bank",
            amount: deposit.amount,
            referenceCode: deposit.referenceCode,
            username: deposit.user?.username || "unknown",
            reason: `Tự động hủy sau ${STALE_THRESHOLD_MINUTES} phút chờ`,
          },
          ip: "127.0.0.1",
        });
      }

      console.log(
        `[AutoRecon] Cancelled stale bank deposit: ${deposit.referenceCode} | ` +
          `${formatVND(deposit.amount)}đ | User: ${deposit.user?.username || "unknown"}`,
      );

      results.push({
        type: "bank",
        id: deposit._id,
        referenceCode: deposit.referenceCode,
        amount: deposit.amount,
        username: deposit.user?.username || "unknown",
      });
    } catch (err) {
      console.error(
        `[AutoRecon] Error cancelling bank deposit ${deposit._id}:`,
        err.message,
      );
    }
  }

  return results;
}

// ── Card deposit auto-fail ──────────────────────────────────────

async function resolveStaleCardDeposits() {
  const threshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

  const staleDeposits = await CardDeposit.find({
    status: "PENDING",
    createdAt: { $lte: threshold },
  })
    .populate("user", "username displayName email")
    .limit(200)
    .lean();

  if (staleDeposits.length === 0) return [];

  const results = [];

  for (const deposit of staleDeposits) {
    try {
      const adminNote = deposit.adminNote
        ? `${deposit.adminNote} | Auto-failed after ${STALE_THRESHOLD_MINUTES}m`
        : `Auto-failed after ${STALE_THRESHOLD_MINUTES}m`;

      const result = await CardDeposit.updateOne(
        { _id: deposit._id, status: "PENDING" }, // CAS: only if still PENDING
        {
          $set: {
            status: "FAILED",
            adminNote,
          },
        },
      );

      // CAS miss — admin already resolved this deposit
      if (result.modifiedCount === 0) continue;

      // Audit log
      if (systemAdminId) {
        logAdminAction({
          adminId: systemAdminId,
          adminName: systemAdminName,
          action: "deposit:reject",
          resource: "deposit",
          resourceId: deposit._id,
          details: {
            type: "card",
            provider: deposit.provider,
            declaredValue: deposit.declaredValue,
            serial: deposit.serial ? `***${deposit.serial.slice(-4)}` : "****",
            username: deposit.user?.username || "unknown",
            reason: `Tự động từ chối sau ${STALE_THRESHOLD_MINUTES} phút chờ`,
          },
          ip: "127.0.0.1",
        });
      }

      console.log(
        `[AutoRecon] Failed stale card deposit: ${deposit.provider} | ` +
          `${formatVND(deposit.declaredValue)}đ | User: ${deposit.user?.username || "unknown"}`,
      );

      results.push({
        type: "card",
        id: deposit._id,
        provider: deposit.provider,
        declaredValue: deposit.declaredValue,
        username: deposit.user?.username || "unknown",
      });
    } catch (err) {
      console.error(
        `[AutoRecon] Error failing card deposit ${deposit._id}:`,
        err.message,
      );
    }
  }

  return results;
}

// ── Telegram notification ───────────────────────────────────────

async function sendReconciliationAlert(results, totalCount) {
  if (results.length === 0) return;

  // Only notify for critical amounts (>= 500,000đ) or when >= 3 deposits resolved
  const criticalItems = results.filter(
    (r) => r.amount >= 500_000 || r.declaredValue >= 500_000,
  );

  if (criticalItems.length === 0 && results.length < 3) return;

  const lines = [
    "\u{1F6A8} <b>T\u1EF0 \u0110\u1ED8NG \u0110\u1ED0I SO\u00C1T</b>",
    "\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014",
    `\u{1F4CA} \u0110\u00E3 x\u1EED l\u00FD <b>${totalCount}</b> giao d\u1ECBch treo:`,
    "",
  ];

  for (const r of results) {
    const amount = r.amount || r.declaredValue || 0;
    const icon = r.type === "bank" ? "\u{1F3E6}" : "\u{1F4B3}";
    const ref = r.referenceCode || r.provider || "N/A";
    const action = r.type === "bank" ? "\u0111\u00E3 h\u1EE7y" : "\u0111\u00E3 t\u1EEB ch\u1ED1i";
    lines.push(
      `${icon} <b>${r.username}</b> \u2014 ${formatVND(amount)}\u0111 (${ref}) \u2014 ${action}`,
    );
  }

  if (criticalItems.length > 0) {
    lines.push(
      "",
      `\u26A0\uFE0F <b>${criticalItems.length}</b> giao d\u1ECBch tr\u00EAn 500,000\u0111`,
    );
  }

  await sendTelegramMessage(lines.join("\n"));
}

// ── Main execution ──────────────────────────────────────────────

async function runReconciliation() {
  try {
    await ensureSystemAdmin();

    const [bankResults, cardResults] = await Promise.all([
      resolveStaleBankDeposits(),
      resolveStaleCardDeposits(),
    ]);

    const totalResolved = bankResults.length + cardResults.length;

    if (totalResolved > 0) {
      const allResults = [...bankResults, ...cardResults];
      console.log(
        `[AutoRecon] Resolved ${totalResolved} stale deposit(s) ` +
          `(bank: ${bankResults.length}, card: ${cardResults.length})`,
      );

      // Send Telegram notification for critical items
      await sendReconciliationAlert(allResults, totalResolved);
    }
  } catch (err) {
    console.error("[AutoRecon] Error during reconciliation:", err.message);
  }
}

// ── Start / Stop ────────────────────────────────────────────────

export function startAutoReconciliation() {
  if (intervalHandle) {
    console.warn("[AutoRecon] Already running");
    return;
  }

  console.log(
    `[AutoRecon] Started — resolving stale PENDING deposits every ${INTERVAL_MS / 1000}s (threshold: ${STALE_THRESHOLD_MINUTES}m)`,
  );

  // Run immediately on start
  runReconciliation();

  intervalHandle = setInterval(runReconciliation, INTERVAL_MS);
}

export function stopAutoReconciliation() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[AutoRecon] Stopped");
  }
}
