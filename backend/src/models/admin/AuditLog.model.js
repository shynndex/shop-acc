import mongoose from "mongoose";

/**
 * AuditLog — Ghi lại mọi hành động quan trọng của admin
 *
 * Các action được log:
 *   account:create, account:update, account:toggle, account:delete
 *   deposit:approve, deposit:reject, deposit:cancel
 *   giftcode:create, giftcode:update, giftcode:delete
 *   review:approve, review:reject
 *   balance:adjust
 *   admin:login, admin:logout
 */
const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    adminName: {
      type: String,
      default: "unknown",
    },
    action: {
      type: String,
      required: true,
      enum: [
        "account:create",
        "account:update",
        "account:toggle",
        "account:delete",
        "deposit:approve",
        "deposit:reject",
        "deposit:cancel",
        "giftcode:create",
        "giftcode:update",
        "giftcode:delete",
        "review:approve",
        "review:reject",
        "balance:adjust",
        "admin:login",
        "admin:logout",
      ],
    },
    resource: {
      type: String,
      required: true,
      enum: ["account", "deposit", "giftcode", "review", "user_balance", "auth"],
    },
    resourceId: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: auto-delete after 90 days

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
