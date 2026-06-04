/**
 * Health Check Controller
 *
 * Provides a lightweight health check endpoint for monitoring / load balancers.
 * Returns server status, database connection state, uptime, and memory usage.
 * Does NOT require authentication — suitable for external monitoring tools.
 */

import mongoose from "mongoose";

const startTime = Date.now();

export async function getHealth(req, res) {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const health = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      human: formatUptime(uptimeSeconds),
    },
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || "development",
    },
    database: {
      status: dbStateMap[dbState] || "unknown",
      connected: dbState === 1,
    },
    memory: {
      rss: formatBytes(memory.rss),
      heapUsed: formatBytes(memory.heapUsed),
      heapTotal: formatBytes(memory.heapTotal),
      external: formatBytes(memory.external),
    },
  };

  // Return 503 if database is not connected
  const statusCode = dbState === 1 ? 200 : 503;

  res.status(statusCode).json(health);
}

// ── Helpers ───────────────────────────────────────────────────────

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
