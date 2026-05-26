import mongoose from "mongoose";
import Account from "../models/Account.model.js";
import Order from "../models/Order.model.js";
import BankDeposit from "../models/client/deposits/BankDeposit.model.js";
import { sellAccount } from "./accountReservation.service.js";

/**
 * Idempotent purchase finalization.
 *
 * Used by BOTH:
 *   1. PayOS webhook (`payosWebhook`)
 *   2. Manual status check (`checkPayOSPurchaseStatus`)
 *
 * Guarantees:
 *   - Will NOT double-complete an order (checks current status)
 *   - Will NOT double-sell an account (uses atomic findOneAndUpdate)
 *   - Can safely be called multiple times with same deposit
 *
 * @param {object} deposit - BankDeposit document (type: "purchase")
 * @param {object} transactionData - Raw payment data to store
 * @param {object} session - Mongoose session
 * @returns {Promise<{order: object, account: object}>}
 * @throws {Error} If account not found or deposit invalid
 */
export async function finalizePurchase(deposit, transactionData, session) {
  // ── 1. Prevent double-finalization ──────────────────────────────────
  if (deposit.status === "PAID") {
    // Already finalized — fetch and return current state
    const order = await Order.findById(deposit.order).session(session);
    const account = await Account.findById(order?.account).session(session);
    return { order, account };
  }

  if (deposit.status !== "PENDING") {
    throw new Error(
      `Cannot finalize deposit ${deposit._id} with status ${deposit.status}`,
    );
  }

  // ── 2. Mark deposit as PAID (CAS with version) ──────────────────────
  const updateVersion = deposit.version || 0;
  const updated = await BankDeposit.findOneAndUpdate(
    {
      _id: deposit._id,
      status: "PENDING",
      version: updateVersion,
    },
    {
      $set: {
        status: "PAID",
        amount: transactionData.amount || deposit.expectedAmount,
        transactionData,
      },
      $inc: { version: 1 },
    },
    { new: true, session },
  );

  if (!updated) {
    throw new Error(
      `[CAS Conflict] Deposit ${deposit._id} was modified by another request (version mismatch or status changed)`,
    );
  }

  // Sync in-memory object for subsequent operations
  deposit.status = "PAID";
  deposit.amount = updated.amount;
  deposit.transactionData = transactionData;
  deposit.version = updateVersion + 1;

  // ── 3. Mark order as completed ──────────────────────────────────────
  const order = await Order.findById(deposit.order).session(session);
  if (!order) {
    throw new Error(`Order ${deposit.order} not found for deposit ${deposit._id}`);
  }

  if (order.status === "pending") {
    order.status = "completed";
    order.completedAt = new Date();
    order.paymentMethod = "payos";
    await order.save({ session });
  }

  // ── 4. Sell account atomically ──────────────────────────────────────
  const account = await sellAccount(order.account, deposit.user, session);
  if (!account) {
    // Account was already sold or in unexpected state — roll back
    throw new Error(
      `Account ${order.account} could not be sold (already sold or concurrent conflict)`,
    );
  }

  return { order, account };
}

/**
 * Cancel a pending purchase: release account + cancel order + cancel deposit.
 *
 * @param {object} deposit - BankDeposit document (type: "purchase")
 * @param {string} reason - Cancellation reason
 * @param {object} session - Mongoose session
 */
export async function cancelPurchase(deposit, reason, session) {
  if (deposit.status !== "PENDING") {
    return; // Already processed
  }

  // ── CAS cancel ─────────────────────────────────────────────────────
  const updateVersion = deposit.version || 0;
  const updated = await BankDeposit.findOneAndUpdate(
    {
      _id: deposit._id,
      status: "PENDING",
      version: updateVersion,
    },
    {
      $set: {
        status: "CANCELLED",
        adminNote: reason,
      },
      $inc: { version: 1 },
    },
    { session },
  );

  if (!updated) {
    // Another request already processed it — still safe to release account below
    return;
  }

  deposit.status = "CANCELLED";
  deposit.version = updateVersion + 1;

  const order = await Order.findById(deposit.order).session(session);
  if (order && order.status === "pending") {
    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelledReason = reason;
    await order.save({ session });

    // Release account atomically
    await Account.findOneAndUpdate(
      {
        _id: order.account,
        status: "reserved",
      },
      {
        $set: {
          status: "available",
          reservedBy: null,
          reservedAt: null,
        },
      },
      { session },
    );
  }
}
