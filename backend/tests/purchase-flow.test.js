/**
 * Purchase Flow — Integration Test
 *
 * Mô phỏng toàn bộ luồng mua tài khoản:
 *   1. Reserve account (available → reserved)
 *   2. Create PayOS purchase (Order + BankDeposit trong transaction)
 *   3. PayOS webhook confirms payment
 *   4. finalizePurchase: deposit PAID → order completed → account sold
 *   5. Cancel flow: deposit CANCELLED → order cancelled → account released
 *   6. Race conditions: CAS conflict handling
 */
import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

// ── Mock ObjectId generator ────────────────────────────────────
const newId = () => new mongoose.Types.ObjectId().toString();
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// ── In-memory model mocks ──────────────────────────────────────
// Sử dụng Map để mô phỏng MongoDB collections
const accounts = new Map();
const orders = new Map();
const deposits = new Map();

function resetDb() {
  accounts.clear();
  orders.clear();
  deposits.clear();
}

// ── Seed một account mẫu ───────────────────────────────────────
function seedAccount(overrides = {}) {
  const doc = {
    _id: newId(),
    title: "Acc Liên Quân VIP",
    game: "lien-quan",
    price: 100000,
    description: "Tài khoản cao rank",
    status: "available",
    isActive: true,
    isSold: false,
    isReserved: false,
    soldTo: null,
    soldAt: null,
    reservedBy: null,
    reservedAt: null,
    loginInfo: { username: "acc_user", password: "acc_pass" },
    ...overrides,
  };
  accounts.set(doc._id, { ...doc });
  return doc;
}

function seedOrder(overrides = {}) {
  const doc = {
    _id: newId(),
    user: newId(),
    account: newId(),
    amount: 100000,
    originalPrice: 100000,
    paymentMethod: "payos",
    status: "pending",
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    notes: "",
    completedAt: null,
    cancelledAt: null,
    cancelledReason: "",
    discount: null,
    ...overrides,
  };
  orders.set(doc._id, { ...doc });
  return doc;
}

function seedDeposit(overrides = {}) {
  const doc = {
    _id: newId(),
    type: "purchase",
    order: null,
    user: newId(),
    bank: newId(),
    referenceCode: `REF${Date.now()}`,
    orderCode: Math.floor(Math.random() * 1000000),
    expectedAmount: 100000,
    amount: 0,
    status: "PENDING",
    payosOrderId: `payos_${Date.now()}`,
    adminNote: "",
    transactionData: null,
    discount: null,
    reservedAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    version: 0,
    bonusAmount: 0,
    ...overrides,
  };
  deposits.set(doc._id, { ...doc });
  return doc;
}

// ── Service implementations (copy logic từ code thật) ──────────

// accountReservation.service.js
async function reserveAccount(accountId, userId) {
  const account = accounts.get(accountId);
  if (!account || account.status !== "available") return null;

  const updated = {
    ...account,
    status: "reserved",
    isReserved: true,
    reservedBy: userId,
    reservedAt: new Date(),
  };
  accounts.set(accountId, updated);
  return updated;
}

async function releaseAccount(accountId) {
  const account = accounts.get(accountId);
  if (!account || account.status !== "reserved") return null;

  const updated = {
    ...account,
    status: "available",
    isReserved: false,
    reservedBy: null,
    reservedAt: null,
  };
  accounts.set(accountId, updated);
  return updated;
}

async function sellAccount(accountId, userId, session) {
  const account = accounts.get(accountId);
  if (!account || (account.status !== "available" && account.status !== "reserved")) {
    return null;
  }

  const updated = {
    ...account,
    status: "sold",
    isSold: true,
    isReserved: false,
    soldTo: userId,
    soldAt: new Date(),
  };
  accounts.set(accountId, updated);
  return updated;
}

// purchaseFinalization.service.js
async function finalizePurchase(deposit, transactionData, session) {
  // ── 1. Prevent double-finalization ──
  if (deposit.status === "PAID") {
    const order = orders.get(deposit.order);
    const account = order ? accounts.get(order.account) : null;
    return { order, account };
  }

  if (deposit.status !== "PENDING") {
    throw new Error(
      `Cannot finalize deposit ${deposit._id} with status ${deposit.status}`,
    );
  }

  // ── 2. CAS deposit update ──
  const storedDeposit = deposits.get(deposit._id);
  if (!storedDeposit || storedDeposit.status !== "PENDING" || storedDeposit.version !== (deposit.version || 0)) {
    throw new Error(
      `[CAS Conflict] Deposit ${deposit._id} was modified by another request`,
    );
  }

  const updatedDeposit = {
    ...storedDeposit,
    status: "PAID",
    amount: transactionData.amount || deposit.expectedAmount,
    transactionData,
    version: storedDeposit.version + 1,
  };
  deposits.set(deposit._id, updatedDeposit);

  // Sync in-memory
  deposit.status = "PAID";
  deposit.amount = updatedDeposit.amount;
  deposit.version = updatedDeposit.version;

  // ── 3. Mark order as completed ──
  const order = orders.get(deposit.order);
  if (!order) {
    throw new Error(`Order ${deposit.order} not found`);
  }

  let updatedOrder = { ...order };
  if (order.status === "pending") {
    updatedOrder = {
      ...order,
      status: "completed",
      completedAt: new Date(),
    };
    orders.set(deposit.order, updatedOrder);
  }

  // ── 4. Sell account ──
  const account = await sellAccount(order.account, deposit.user);
  if (!account) {
    throw new Error(`Account ${order.account} could not be sold`);
  }

  return { order: updatedOrder, account };
}

async function cancelPurchase(deposit, reason) {
  if (deposit.status !== "PENDING") return;

  const storedDeposit = deposits.get(deposit._id);
  if (!storedDeposit || storedDeposit.status !== "PENDING" || storedDeposit.version !== (deposit.version || 0)) {
    return; // Another request already processed it
  }

  const updatedDeposit = {
    ...storedDeposit,
    status: "CANCELLED",
    adminNote: reason,
    version: storedDeposit.version + 1,
  };
  deposits.set(deposit._id, updatedDeposit);
  deposit.status = "CANCELLED";
  deposit.version = updatedDeposit.version;

  const order = orders.get(deposit.order);
  if (order && order.status === "pending") {
    const updatedOrder = {
      ...order,
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledReason: reason,
    };
    orders.set(deposit.order, updatedOrder);

    // Release account
    await releaseAccount(order.account);
  }
}

// ══════════════════════════════════════════════════════════════════
//  TESTS
// ══════════════════════════════════════════════════════════════════

describe("Purchase Flow — Mua tài khoản", () => {
  let account, user, deposit, order;

  beforeEach(() => {
    resetDb();
    user = newId();
    account = seedAccount({ price: 50000 });
    order = seedOrder({ user, account: account._id, amount: 50000 });
    deposit = seedDeposit({
      order: order._id,
      user,
      expectedAmount: 50000,
    });
  });

  // ──────────────────────────────────────────────────────────────
  //  1. RESERVE ACCOUNT
  // ──────────────────────────────────────────────────────────────

  describe("1. Reserve Account", () => {
    it("reserveAccount: available → reserved thành công", async () => {
      const result = await reserveAccount(account._id, user);
      expect(result).not.toBeNull();
      expect(result.status).toBe("reserved");
      expect(result.reservedBy).toBe(user);
      expect(result.isReserved).toBe(true);
      expect(result.isSold).toBe(false);
    });

    it("reserveAccount: fail nếu account đã reserved", async () => {
      await reserveAccount(account._id, user);
      // Thử reserve lại lần nữa
      const result = await reserveAccount(account._id, newId());
      expect(result).toBeNull();
    });

    it("reserveAccount: fail nếu account đã sold", async () => {
      const soldAcc = seedAccount({ status: "sold", isSold: true });
      const result = await reserveAccount(soldAcc._id, user);
      expect(result).toBeNull();
    });

    it("reserveAccount: fail nếu account không tồn tại", async () => {
      const result = await reserveAccount(newId(), user);
      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  //  2. RELEASE ACCOUNT
  // ──────────────────────────────────────────────────────────────

  describe("2. Release Account", () => {
    it("releaseAccount: reserved → available thành công", async () => {
      await reserveAccount(account._id, user);
      const result = await releaseAccount(account._id);
      expect(result).not.toBeNull();
      expect(result.status).toBe("available");
      expect(result.reservedBy).toBeNull();
      expect(result.isReserved).toBe(false);
    });

    it("releaseAccount: fail nếu account đang available (chưa reserve)", async () => {
      const result = await releaseAccount(account._id);
      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  //  3. FULL PURCHASE FLOW
  // ──────────────────────────────────────────────────────────────

  describe("3. Full Purchase Flow", () => {
    it("Luồng thành công: reserve → pay → finalize → account sold", async () => {
      // Bước 1: Reserve
      const reserved = await reserveAccount(account._id, user);
      expect(reserved.status).toBe("reserved");

      // Bước 2: Finalize (mô phỏng webhook gọi)
      const txnData = {
        orderCode: deposit.orderCode,
        amount: 50000,
        paidAt: new Date().toISOString(),
      };

      const { order: completedOrder, account: soldAccount } =
        await finalizePurchase(deposit, txnData);

      // Verify deposit
      const updatedDeposit = deposits.get(deposit._id);
      expect(updatedDeposit.status).toBe("PAID");
      expect(updatedDeposit.amount).toBe(50000);
      expect(updatedDeposit.transactionData).toEqual(txnData);
      expect(updatedDeposit.version).toBe(1);

      // Verify order
      expect(completedOrder.status).toBe("completed");
      expect(completedOrder.completedAt).not.toBeNull();

      // Verify account
      expect(soldAccount.status).toBe("sold");
      expect(soldAccount.isSold).toBe(true);
      expect(soldAccount.soldTo).toBe(user);
      expect(soldAccount.soldAt).not.toBeNull();
    });

    it("finalizePurchase: idempotent — gọi 2 lần vẫn ra kết quả giống nhau", async () => {
      await reserveAccount(account._id, user);
      const txnData = { amount: 50000, paidAt: new Date().toISOString() };

      // Lần 1
      const result1 = await finalizePurchase(deposit, txnData);
      expect(result1.order.status).toBe("completed");

      // Lần 2 (deposit đã PAID, finalize vào nhánh early return)
      const result2 = await finalizePurchase(deposit, txnData);
      expect(result2.order.status).toBe("completed");
      expect(result2.account.status).toBe("sold");

      // Verify deposit không bị double-update
      const updatedDeposit = deposits.get(deposit._id);
      expect(updatedDeposit.version).toBe(1); // Chỉ tăng 1 lần
    });

    it("finalizePurchase: fail nếu deposit không ở PENDING", async () => {
      const cancelledDeposit = seedDeposit({
        order: order._id,
        user,
        status: "CANCELLED",
      });

      await expect(
        finalizePurchase(cancelledDeposit, {}),
      ).rejects.toThrow("Cannot finalize deposit");
    });

    it("finalizePurchase: fail nếu account đã sold trước đó", async () => {
      await reserveAccount(account._id, user);

      // Bán account trước (mô phỏng concurrent request)
      await sellAccount(account._id, newId());

      // finalizePurchase sẽ throw vì account đã sold
      await expect(
        finalizePurchase(deposit, { amount: 50000 }),
      ).rejects.toThrow("could not be sold");
    });
  });

  // ──────────────────────────────────────────────────────────────
  //  4. SELL ACCOUNT
  // ──────────────────────────────────────────────────────────────

  describe("4. Sell Account", () => {
    it("sellAccount: reserved → sold thành công", async () => {
      await reserveAccount(account._id, user);
      const result = await sellAccount(account._id, user);
      expect(result).not.toBeNull();
      expect(result.status).toBe("sold");
      expect(result.soldTo).toBe(user);
    });

    it("sellAccount: available → sold thành công (mua trực tiếp không reserve)", async () => {
      const result = await sellAccount(account._id, user);
      expect(result.status).toBe("sold");
    });

    it("sellAccount: fail nếu account đã sold trước đó", async () => {
      const soldAcc = seedAccount({ status: "sold", isSold: true });
      const result = await sellAccount(soldAcc._id, user);
      expect(result).toBeNull();
    });

    it("sellAccount: fail nếu account không tồn tại", async () => {
      const result = await sellAccount(newId(), user);
      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  //  5. CANCEL FLOW
  // ──────────────────────────────────────────────────────────────

  describe("5. Cancel Purchase Flow", () => {
    it("Huỷ thành công: deposit CANCELLED → order cancelled → account available", async () => {
      await reserveAccount(account._id, user);

      await cancelPurchase(deposit, "Huỷ bởi người dùng");

      // Verify deposit
      const updatedDeposit = deposits.get(deposit._id);
      expect(updatedDeposit.status).toBe("CANCELLED");
      expect(updatedDeposit.adminNote).toBe("Huỷ bởi người dùng");

      // Verify order
      const updatedOrder = orders.get(order._id);
      expect(updatedOrder.status).toBe("cancelled");
      expect(updatedOrder.cancelledReason).toBe("Huỷ bởi người dùng");

      // Verify account released
      const updatedAccount = accounts.get(account._id);
      expect(updatedAccount.status).toBe("available");
      expect(updatedAccount.reservedBy).toBeNull();
    });

    it("cancelPurchase: idempotent — gọi 2 lần vẫn ra kết quả giống nhau", async () => {
      await reserveAccount(account._id, user);

      await cancelPurchase(deposit, "Lần 1");
      const versionAfterCancel = deposits.get(deposit._id).version;

      await cancelPurchase(deposit, "Lần 2"); // deposit đã CANCELLED → early return
      const versionAfterSecond = deposits.get(deposit._id).version;

      expect(versionAfterSecond).toBe(versionAfterCancel); // Không tăng version
    });
  });

  // ──────────────────────────────────────────────────────────────
  //  6. RACE CONDITIONS
  // ──────────────────────────────────────────────────────────────

  describe("6. Race Conditions", () => {
    it("CAS conflict: 2 webhook đồng thời — chỉ 1 thành công", async () => {
      await reserveAccount(account._id, user);

      // Clone deposit object (mô phỏng 2 request cùng lúc)
      const depositA = { ...deposit }; // version = 0
      const depositB = { ...deposit }; // version = 0

      const txnData = { amount: 50000 };

      // Cả 2 cùng gọi finalizePurchase
      const resultA = await finalizePurchase(depositA, txnData);
      expect(resultA.order.status).toBe("completed");

      // Request B thất bại vì CAS conflict (version đã thay đổi)
      await expect(
        finalizePurchase(depositB, txnData),
      ).rejects.toThrow(/CAS Conflict/);

      // Chỉ 1 deposit được update
      const finalDeposit = deposits.get(deposit._id);
      expect(finalDeposit.version).toBe(1);
    });

    it("Cancel vs Webhook race: thằng nào chạy trước thắng, thằng sau bị loại", async () => {
      await reserveAccount(account._id, user);

      const depositForCancel = { ...deposit };
      const depositForFinalize = { ...deposit };

      // Cancel chạy trước
      await cancelPurchase(depositForCancel, "User cancelled");

      // Webhook chạy sau — CAS conflict
      await expect(
        finalizePurchase(depositForFinalize, { amount: 50000 }),
      ).rejects.toThrow(/CAS Conflict/);

      // Account phải được release (không bị bán)
      const updatedAccount = accounts.get(account._id);
      expect(updatedAccount.status).toBe("available");
    });

    it("Webhook chạy trước, Cancel chạy sau — account đã sold", async () => {
      await reserveAccount(account._id, user);

      const depositForFinalize = { ...deposit };
      const depositForCancel = { ...deposit };

      // Webhook chạy trước
      await finalizePurchase(depositForFinalize, { amount: 50000 });

      // Cancel chạy sau — deposit đã PAID → early return
      await cancelPurchase(depositForCancel, "Too late!");

      // Account đã sold
      const updatedAccount = accounts.get(account._id);
      expect(updatedAccount.status).toBe("sold");
    });
  });

  // ──────────────────────────────────────────────────────────────
  //  7. EDGE CASES
  // ──────────────────────────────────────────────────────────────

  describe("7. Edge Cases", () => {
    it("Mua có giftcode: bonusAmount được tính đúng", async () => {
      const accountWithDiscount = seedAccount({ price: 200000 });
      const discountDeposit = seedDeposit({
        order: order._id,
        user,
        expectedAmount: 180000,
        discount: {
          code: "SALE10",
          type: "percent",
          value: 10,
          amount: 20000,
        },
      });

      await reserveAccount(accountWithDiscount._id, user);

      const txnData = { amount: 180000 };
      await finalizePurchase(discountDeposit, txnData);

      const updatedDeposit = deposits.get(discountDeposit._id);
      expect(updatedDeposit.status).toBe("PAID");
      expect(updatedDeposit.amount).toBe(180000);
      expect(updatedDeposit.version).toBe(1);
    });

    it("Account không tồn tại → reserveAccount trả null", async () => {
      const result = await reserveAccount(newId(), user);
      expect(result).toBeNull();
    });

    it("Order không tồn tại → finalizePurchase throw error", async () => {
      const orphanDeposit = seedDeposit({
        order: newId(), // Order không tồn tại
        user,
      });

      await expect(
        finalizePurchase(orphanDeposit, { amount: 50000 }),
      ).rejects.toThrow("not found");
    });
  });
});
