/**
 * Marquee Service
 *
 * In-memory event store for real-time scrolling marquee notifications.
 * Stores the last 100 events and supports SSE streaming for public clients.
 *
 * Events show:
 *   - Users who just deposited
 *   - Users who just bought an account
 *   - Users who just random-rolled an account
 *   - Manual messages from admin
 *
 * Events do NOT include boosting services.
 */

/* ─── In-memory event store ─────────────────────────────────────── */
const MAX_EVENTS = 100;
const events = [];

/* ─── SSE clients (public marquee — no auth) ────────────────────── */
const sseClients = new Set();

function sendSSE(client, event) {
  if (client.writableEnded) {
    sseClients.delete(client);
    return;
  }
  try {
    client.write(`id:${event.id}\n`);
    client.write(`event:marquee_event\n`);
    client.write(`data:${JSON.stringify(event)}\n\n`);
  } catch {
    sseClients.delete(client);
  }
}

function broadcast(event) {
  for (const client of sseClients) {
    sendSSE(client, event);
  }
}

/* ─── Heartbeat for SSE clients ─────────────────────────────────── */
let heartbeatInterval = null;

function startHeartbeat() {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => {
    for (const client of sseClients) {
      if (!client.writableEnded) {
        client.write(": heartbeat\n\n");
      } else {
        sseClients.delete(client);
      }
    }
  }, 30000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/* ─── Public API ────────────────────────────────────────────────── */

let nextId = 1;

/**
 * Push a marquee event.
 *
 * @param {'deposit'|'purchase'|'random'|'manual'} type
 * @param {string} username
 * @param {object} options
 * @param {number}  [options.amount]
 * @param {string}  [options.item]        — e.g. account title, game name
 * @param {string}  [options.message]     — custom message (overrides auto-generated)
 */
export function pushMarqueeEvent(type, username, options = {}) {
  const { amount, item, message: customMessage } = options;

  // Build auto-generated message
  let message = customMessage || "";
  if (!message) {
    const displayName = username || "Khách";
    switch (type) {
      case "deposit":
        message = `${displayName} vừa nạp ${(amount || 0).toLocaleString("vi-VN")}đ`;
        break;
      case "purchase":
        message = `${displayName} vừa mua tài khoản${item ? ` ${item}` : ""}`;
        break;
      case "random":
        message = `${displayName} vừa quay random tài khoản${item ? ` ${item}` : ""}`;
        break;
      case "manual":
        message = customMessage || "";
        break;
      default:
        message = customMessage || `${displayName} vừa có giao dịch mới`;
    }
  }

  const event = {
    id: nextId++,
    type,
    username,
    message,
    amount: amount || 0,
    item: item || "",
    timestamp: new Date().toISOString(),
  };

  events.push(event);

  // Trim to max size
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  // Broadcast to SSE clients
  broadcast(event);

  return event;
}

/**
 * Get events since a given ID.
 * @param {number} [sinceId=0] - Return events with id > sinceId
 * @param {number} [limit=20]  - Max events to return
 * @returns {Array}
 */
export function getMarqueeEvents(sinceId = 0, limit = 20) {
  if (sinceId > 0) {
    return events.filter((e) => e.id > sinceId).slice(-limit);
  }
  return events.slice(-limit);
}

/**
 * Get the latest event ID (for initial SSE sync).
 */
export function getLatestEventId() {
  if (events.length === 0) return 0;
  return events[events.length - 1].id;
}

/**
 * Register an SSE client for real-time marquee updates.
 * The response must be configured with SSE headers before calling this.
 *
 * @param {import('express').Response} res
 */
export function addMarqueeSSEClient(res) {
  sseClients.add(res);
  startHeartbeat();

  // Send existing events on connect
  const recent = getMarqueeEvents(0, 20);
  for (const event of recent) {
    sendSSE(res, event);
  }

  // Cleanup on disconnect
  const cleanup = () => {
    sseClients.delete(res);
    if (sseClients.size === 0) {
      stopHeartbeat();
    }
  };
  res.on("close", cleanup);
  res.on("end", cleanup);
}
