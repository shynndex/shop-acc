/**
 * ReleaseExpiredReservations Job
 *
 * Runs every 60 seconds and releases account reservations that have
 * been in "reserved" state for longer than 15 minutes.
 *
 * This is a safety net in case:
 *   - User creates PayOS payment link but never pays
 *   - User closes browser during payment
 *   - PayOS webhook is delayed or lost
 *   - Server crashes mid-transaction
 */
import { releaseExpiredReservations } from "../services/accountReservation.service.js";

const INTERVAL_MS = 60_000; // Check every 60 seconds
const EXPIRY_MINUTES = 15;

let intervalHandle = null;

export function startExpiredReservationSweeper() {
  if (intervalHandle) {
    console.warn("[Sweeper] Already running");
    return;
  }

  console.log(
    `[Sweeper] Started — checking for expired reservations every ${INTERVAL_MS / 1000}s`,
  );

  intervalHandle = setInterval(async () => {
    try {
      const result = await releaseExpiredReservations(EXPIRY_MINUTES);
      if (result.modifiedCount > 0) {
        console.log(
          `[Sweeper] Released ${result.modifiedCount} expired reservation(s)`,
        );
      }
    } catch (error) {
      console.error("[Sweeper] Error releasing expired reservations:", error);
    }
  }, INTERVAL_MS);
}

export function stopExpiredReservationSweeper() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[Sweeper] Stopped");
  }
}
