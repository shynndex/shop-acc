import AuditLog from "../../models/admin/AuditLog.model.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

// ============================================================================
// LIST AUDIT LOGS
// GET /api/admin/audit-logs
// ============================================================================

export const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    search,
    action,
    resource,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  // Filter by action
  if (action) {
    query.action = action;
  }

  // Filter by resource
  if (resource) {
    query.resource = resource;
  }

  // Filter by date range
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  // Search across adminName, resourceId, or details (action)
  if (search) {
    query.$or = [
      { adminName: { $regex: search, $options: "i" } },
      { resourceId: { $regex: search, $options: "i" } },
      { action: { $regex: search, $options: "i" } },
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      logs,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      totalItems: total,
    },
  });
});

// ============================================================================
// EXPORT AUDIT LOGS CSV
// GET /api/admin/audit-logs/export
// ============================================================================

export const exportAuditLogsCsv = asyncHandler(async (req, res) => {
  const { action, resource, dateFrom, dateTo } = req.query;

  const query = {};
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const logs = await AuditLog.find(query).sort({ createdAt: -1 }).lean();

  const headers = [
    "Thời gian",
    "Admin",
    "Hành động",
    "Tài nguyên",
    "Resource ID",
    "IP",
    "Chi tiết",
  ];

  const csvRows = [headers.join(",")];
  for (const log of logs) {
    const row = [
      log.createdAt ? new Date(log.createdAt).toISOString() : "",
      `"${(log.adminName || "").replace(/"/g, '""')}"`,
      log.action || "",
      log.resource || "",
      log.resourceId || "",
      log.ip || "",
      `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
    ];
    csvRows.push(row.join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=audit_logs_${Date.now()}.csv`,
  );
  res.send("\uFEFF" + csvRows.join("\n"));
});
