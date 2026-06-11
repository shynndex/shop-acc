import express from "express";
import { sseLimiter } from "../middlewares/rateLimiter.middleware.js";
import { addMarqueeSSEClient, getMarqueeEvents, getLatestEventId } from "../services/marquee.service.js";

const router = express.Router();

/**
 * GET /api/ui/marquee/stream
 *
 * Public SSE endpoint for real-time marquee notifications.
 * No authentication required — just rate-limited.
 *
 * Returns:
 *   - Existing recent events on connect
 *   - New marquee_event events in real-time
 */
router.get("/stream", sseLimiter, (req, res) => {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send initial connection comment
  res.write(": connected to marquee stream\n\n");

  // Register client
  addMarqueeSSEClient(res);
});

/**
 * GET /api/ui/marquee/events
 *
 * Fallback polling endpoint — returns recent events as JSON.
 * Used by clients that don't support SSE or as initial data source.
 */
router.get("/events", (req, res) => {
  const { since = 0, limit = 20 } = req.query;
  const data = getMarqueeEvents(Number(since) || 0, Number(limit) || 20);
  const latestId = getLatestEventId();

  res.json({
    success: true,
    data: {
      events: data,
      latestId,
      hasMore: data.length > 0,
    },
  });
});

export default router;
