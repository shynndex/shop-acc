import AuditLog from "../models/admin/AuditLog.model.js";

/**
 * Log an admin action to MongoDB AuditLog.
 *
 * @param {object} params
 * @param {import("mongoose").ObjectId|string} params.adminId
 * @param {string}  params.adminName         - Admin display name
 * @param {string}  params.action            - One of AuditLog schema actions
 * @param {string}  params.resource          - "account" | "deposit" | "giftcode" | "review" | "user_balance"
 * @param {string}  [params.resourceId]      - MongoDB _id of the affected resource
 * @param {object}  [params.details]         - Arbitrary JSON details (changes, status, etc.)
 * @param {string}  [params.ip]              - Originating IP
 */
export async function logAdminAction({
  adminId,
  adminName,
  action,
  resource,
  resourceId = null,
  details = {},
  ip = "",
}) {
  try {
    await AuditLog.create({
      adminId,
      adminName: adminName || "unknown",
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      details,
      ip,
    });
  } catch (err) {
    // Silent fail — never crash the app for audit logging
    console.error("[AdminAudit] Failed to write audit log:", err.message);
  }
}
