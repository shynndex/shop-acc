export type AuditAction =
  | "account:create"
  | "account:update"
  | "account:toggle"
  | "account:delete"
  | "deposit:approve"
  | "deposit:reject"
  | "deposit:cancel"
  | "giftcode:create"
  | "giftcode:update"
  | "giftcode:delete"
  | "review:approve"
  | "review:reject"
  | "balance:adjust"
  | "admin:login"
  | "admin:logout";

export type AuditResource =
  | "account"
  | "deposit"
  | "giftcode"
  | "review"
  | "user_balance"
  | "auth";

export interface AuditLog {
  _id: string;
  adminId: string;
  adminName: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string | null;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}
