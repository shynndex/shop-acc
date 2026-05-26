import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_DIR =
  process.env.AUDIT_LOG_DIR ||
  path.resolve(__dirname, "../../logs/audit");

const MAX_RETENTION_DAYS = 30;

// ── Helpers ──────────────────────────────────────────────────────

function getLogPath(date = new Date()) {
  const dateStr = date.toISOString().slice(0, 10);
  return path.join(AUDIT_DIR, `balance-${dateStr}.jsonl`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendLine(filePath, data) {
  ensureDir(path.dirname(filePath));
  const line = JSON.stringify(data) + "\n";
  fs.appendFileSync(filePath, line, "utf-8");
}

// ── Main API ─────────────────────────────────────────────────────

/**
 * Log a balance change event.
 *
 * @param {object} params
 * @param {string} params.userId   - MongoDB _id of the user
 * @param {string} params.userName - displayName or username
 * @param {'purchase'|'deposit_bank'|'deposit_card'|'admin_adjust'|'purchase_refund'} params.type
 * @param {number}  params.amount  - Positive for credit, negative for debit
 * @param {number}  params.balanceBefore
 * @param {number}  params.balanceAfter
 * @param {string}  params.reference - Order/deposit/admin reference ID
 * @param {string}  [params.note]   - Optional description
 * @param {string}  [params.ip]     - Originating IP (if available)
 */
export function logBalanceChange({
  userId,
  userName,
  type,
  amount,
  balanceBefore,
  balanceAfter,
  reference,
  note = "",
  ip = "",
}) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      userId: String(userId),
      userName: userName || "unknown",
      type,
      amount,
      balanceBefore,
      balanceAfter,
      delta: balanceAfter - balanceBefore,
      reference: String(reference),
      note: String(note).slice(0, 500),
      ...(ip ? { ip } : {}),
    };

    appendLine(getLogPath(), entry);
  } catch (err) {
    // Silent fail — never crash the app for audit logging
    console.error("[AuditLogger] Failed to write log:", err.message);
  }
}

// ── Cleanup job ─────────────────────────────────────────────────

/**
 * Remove audit log files older than MAX_RETENTION_DAYS.
 * Safe to call on every server start + periodically.
 */
export function cleanOldAuditLogs() {
  try {
    ensureDir(AUDIT_DIR);
    const files = fs.readdirSync(AUDIT_DIR);
    const now = Date.now();

    for (const file of files) {
      if (!file.startsWith("balance-") || !file.endsWith(".jsonl")) continue;

      const datePart = file.slice(8, 18);
      const fileDate = new Date(datePart + "T00:00:00.000Z");
      const ageDays = (now - fileDate.getTime()) / (1000 * 60 * 60 * 24);

      if (ageDays > MAX_RETENTION_DAYS) {
        fs.unlinkSync(path.join(AUDIT_DIR, file));
        console.log(`[AuditLogger] Removed old log: ${file}`);
      }
    }
  } catch (err) {
    console.error("[AuditLogger] Cleanup error:", err.message);
  }
}
