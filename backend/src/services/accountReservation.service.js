import Account from "../models/Account.model.js";

/**
 * Atomic account state machine service.
 *
 * State transitions:
 *   available ──reserve()──▶ reserved ──sell()──▶ sold
 *       ◀────release()─────
 *
 * All operations use findOneAndUpdate with conditions (not find+save),
 * so they are safe under concurrency — no race condition possible.
 */

/**
 * Reserve an account atomically.
 * Only succeeds if account is currently "available".
 *
 * @param {string} accountId
 * @param {string} userId
 * @returns {Promise<object|null>} The updated account or null if not available
 */
export async function reserveAccount(accountId, userId) {
  return Account.findOneAndUpdate(
    {
      _id: accountId,
      status: "available",
    },
    {
      $set: {
        status: "reserved",
        reservedBy: userId,
        reservedAt: new Date(),
      },
    },
    { new: true },
  );
}

/**
 * Release a reserved account atomically.
 * Only succeeds if account is currently "reserved".
 *
 * @param {string} accountId
 * @returns {Promise<object|null>} The updated account or null if not reserved
 */
export async function releaseAccount(accountId) {
  return Account.findOneAndUpdate(
    {
      _id: accountId,
      status: "reserved",
    },
    {
      $set: {
        status: "available",
        reservedBy: null,
        reservedAt: null,
      },
    },
    { new: true },
  );
}

/**
 * Mark an account as sold atomically.
 * Accepts either "available" or "reserved" as starting state.
 *
 * @param {string} accountId
 * @param {string} userId
 * @param {object} [session] - Mongoose session for transactions
 * @returns {Promise<object|null>} The updated account or null
 */
export async function sellAccount(accountId, userId, session) {
  const opts = session ? { session, new: true } : { new: true };
  return Account.findOneAndUpdate(
    {
      _id: accountId,
      status: { $in: ["available", "reserved"] },
    },
    {
      $set: {
        status: "sold",
        soldTo: userId,
        soldAt: new Date(),
      },
    },
    opts,
  );
}

/**
 * Release all reservations that have expired.
 * An reservation is considered expired if it's been in "reserved" state
 * for longer than expiryMinutes (default 15).
 *
 * @param {number} [expiryMinutes=15]
 * @returns {Promise<{modifiedCount: number}>}
 */
export async function releaseExpiredReservations(expiryMinutes = 15) {
  const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);
  const result = await Account.updateMany(
    {
      status: "reserved",
      reservedAt: { $lt: cutoff },
    },
    {
      $set: {
        status: "available",
        reservedBy: null,
        reservedAt: null,
      },
    },
  );
  return { modifiedCount: result.modifiedCount };
}
