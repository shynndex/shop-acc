/**
 * Request Logger Middleware
 *
 * Logs all HTTP requests with method, URL, status code, duration, IP, and User-Agent.
 * Outputs structured JSON to stdout for easy parsing (e.g., via jq or log aggregators).
 *
 * In development mode, uses a concise color-coded format.
 * In production, outputs JSON lines.
 */

const isDev = process.env.NODE_ENV !== "production";

// ── Color helpers (development only) ─────────────────────────────
const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function statusColor(status) {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  return colors.green;
}

function methodColor(method) {
  switch (method) {
    case "GET": return colors.green;
    case "POST": return colors.cyan;
    case "PUT": return colors.yellow;
    case "PATCH": return colors.magenta;
    case "DELETE": return colors.red;
    default: return colors.dim;
  }
}

// ── Middleware ────────────────────────────────────────────────────
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  // Capture end event
  res.on("finish", () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;

    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip || req.connection?.remoteAddress || "unknown",
      userAgent: (req.headers["user-agent"] || "").substring(0, 120),
      contentLength: res.getHeader("content-length") || 0,
    };

    // Enrich with admin info if available (set by adminProtect middleware)
    if (req.admin) {
      log.adminId = String(req.admin._id);
      log.adminName = req.admin.username;
    }

    // Enrich with user info if available (set by client auth middleware)
    if (req.user) {
      log.userId = String(req.user._id);
      log.userName = req.user.username;
    }

    if (isDev) {
      // ── Development: color-coded human-readable ───────────────
      const methodStr = `${methodColor(req.method)}${req.method.padEnd(7)}${colors.reset}`;
      const statusStr = `${statusColor(res.statusCode)}${res.statusCode}${colors.reset}`;
      const durationStr = `${colors.dim}${durationMs.toFixed(1).padStart(7)}ms${colors.reset}`;
      const ipStr = `${colors.dim}${log.ip}${colors.reset}`;

      console.log(
        `${methodStr} ${statusStr} ${durationStr} ${ipStr} ${req.originalUrl || req.url}`,
      );
    } else {
      // ── Production: JSON line ─────────────────────────────────
      console.log(JSON.stringify(log));
    }
  });

  next();
}

