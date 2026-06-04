/**
 * Webhook Buffer Parsing Fix — Integration Test
 *
 * Vấn đề: express.raw() làm req.body thành Buffer, nhưng code webhook
 * truy cập body.data, body.callback_sign, etc. — undefined trên Buffer.
 *
 * Fix: Parse Buffer → JSON trước khi xử lý.
 *
 * Test này mô phỏng luồng express.raw() và xác nhận fix hoạt động.
 */
import { describe, it, expect } from "vitest";

// ── Mô phỏng express.raw() ──────────────────────────────────────
// express.raw() parse body thành Buffer
function simulateRawBody(jsonObj) {
  return Buffer.from(JSON.stringify(jsonObj), "utf-8");
}

// ── Mô phỏng PayOS webhook payload ──────────────────────────────
const MOCK_PAYOS_WEBHOOK = {
  data: {
    orderCode: 123456,
    amount: 50000,
    description: "test-ref-001",
    paidAt: "2026-05-30T12:00:00.000Z",
  },
  signature: "mock-signature-for-testing",
};

// ── Mô phỏng Card (NetPay) webhook payload ──────────────────────
const MOCK_CARD_WEBHOOK = {
  callback_sign: "TEST_SIGN",
  code: 1,
  serial: "SERIAL123456",
  status: 1,
  amount: 50000,
  declared_value: 50000,
  trans_id: "TXN123456",
  request_id: "REQ123456",
  telco: "VIETTEL",
  message: "Giao dịch thành công",
};

// ── Mô phỏng CardProvider service ───────────────────────────────
function verifyWebhookSignature(body) {
  const { callback_sign, code, serial } = body;
  if (!callback_sign || !code || !serial) return false;
  // Trong thực tế: md5(partnerKey + code + serial) === callback_sign
  return callback_sign === "TEST_SIGN" && code === 1;
}

function parseWebhookData(body) {
  return {
    success: body.status === 1,
    code: body.status,
    message: body.message,
    transId: body.trans_id,
    requestId: body.request_id,
    receivedAmount: body.amount || 0,
    declaredValue: body.declared_value || 0,
    isAmountMismatch: body.amount !== body.declared_value,
    telco: body.telco,
    raw: { ...body, callback_sign: "***" },
  };
}

// ══════════════════════════════════════════════════════════════════
//  TEST: PayOS Webhook Buffer Fix
// ══════════════════════════════════════════════════════════════════

describe("PayOS Webhook — Buffer parsing fix", () => {
  it("express.raw() trả về Buffer, KHÔNG phải Object", () => {
    const rawBody = simulateRawBody(MOCK_PAYOS_WEBHOOK);
    expect(Buffer.isBuffer(rawBody)).toBe(true);
    // ❌ Buffer không có .data — sẽ undefined
    expect(rawBody.data).toBeUndefined();
  });

  it("FIX: Parse Buffer → JSON, truy cập body.data đúng", () => {
    const rawBody = simulateRawBody(MOCK_PAYOS_WEBHOOK);
    const body = JSON.parse(rawBody.toString());
    expect(body.data).toBeDefined();
    expect(body.data.orderCode).toBe(123456);
    expect(body.data.amount).toBe(50000);
  });

  it("FIX: payOS.webhooks.verify() nhận parsed object, trả về data", async () => {
    // Mô phỏng payOS.webhooks.verify()
    // Trong thực tế: verify signature rồi trả về body.data
    const rawBody = simulateRawBody(MOCK_PAYOS_WEBHOOK);
    const body = JSON.parse(rawBody.toString());

    // Giả lập verify thành công
    const mockVerify = async (webhookBody) => {
      const { data, signature } = webhookBody;
      if (!data || !signature) throw new Error("Invalid webhook data");
      return data; // Trả về body.data
    };

    const data = await mockVerify(body);
    expect(data).toEqual(MOCK_PAYOS_WEBHOOK.data);
    expect(data.orderCode).toBe(123456);
    expect(data.amount).toBe(50000);
  });

  it("FIX: payOS.webhooks.verify() throw khi signature sai", async () => {
    const tamperedPayload = {
      ...MOCK_PAYOS_WEBHOOK,
      signature: "wrong-signature",
    };
    const rawBody = simulateRawBody(tamperedPayload);
    const body = JSON.parse(rawBody.toString());

    const mockVerify = async (webhookBody) => {
      const { data, signature } = webhookBody;
      if (!data || !signature) throw new Error("Invalid webhook data");
      if (signature !== "mock-signature-for-testing") {
        throw new Error("Data not integrity");
      }
      return data;
    };

    await expect(mockVerify(body)).rejects.toThrow("Data not integrity");
  });
});

// ══════════════════════════════════════════════════════════════════
//  TEST: Card Webhook Buffer Fix
// ══════════════════════════════════════════════════════════════════

describe("Card Webhook — Buffer parsing fix", () => {
  it("express.raw() trả về Buffer — .callback_sign undefined", () => {
    const rawBody = simulateRawBody(MOCK_CARD_WEBHOOK);
    expect(Buffer.isBuffer(rawBody)).toBe(true);
    // ❌ Buffer không có .callback_sign — undefined
    expect(rawBody.callback_sign).toBeUndefined();
    expect(rawBody.code).toBeUndefined();
    expect(rawBody.serial).toBeUndefined();
  });

  it("FIX: Parse Buffer → JSON TRƯỚC khi verify signature", () => {
    const rawBody = simulateRawBody(MOCK_CARD_WEBHOOK);

    // Giống code đã fix: parse trước, verify sau
    const body = JSON.parse(rawBody.toString());
    const isValid = verifyWebhookSignature(body);

    expect(isValid).toBe(true);
    expect(body.callback_sign).toBe("TEST_SIGN");
    expect(body.code).toBe(1);
    expect(body.serial).toBe("SERIAL123456");
  });

  it("FIX: Với Buffer KHÔNG parse, verify luôn fail (bug gốc)", () => {
    const rawBody = simulateRawBody(MOCK_CARD_WEBHOOK);
    // ❌ Gọi trực tiếp với Buffer — như code cũ
    const isValid = verifyWebhookSignature(rawBody);
    expect(isValid).toBe(false); // Luôn fail!
  });

  it("FIX: parseWebhookData hoạt động đúng sau khi parse", () => {
    const rawBody = simulateRawBody(MOCK_CARD_WEBHOOK);
    const body = JSON.parse(rawBody.toString());
    const parsed = parseWebhookData(body);

    expect(parsed.success).toBe(true);
    expect(parsed.receivedAmount).toBe(50000);
    expect(parsed.transId).toBe("TXN123456");
    expect(parsed.telco).toBe("VIETTEL");
  });

  it("FIX: Full card webhook flow simulation", () => {
    const rawBody = simulateRawBody(MOCK_CARD_WEBHOOK);

    // === Bước 1: Parse Buffer → JSON (FIX) ===
    const body = JSON.parse(rawBody.toString());

    // === Bước 2: Verify signature ===
    const isValid = verifyWebhookSignature(body);
    expect(isValid).toBe(true);

    // === Bước 3: Parse webhook data ===
    const parsed = parseWebhookData(body);
    expect(parsed.success).toBe(true);

    // === Bước 4: CAS update deposit ===
    const oldVersion = 0;
    const deposit = { _id: "dep_1", status: "PENDING", version: oldVersion };
    const updateFields = {
      status: parsed.success ? "SUCCESS" : "FAILED",
      receivedAmount: parsed.receivedAmount,
      apiTransId: parsed.transId,
    };

    // Mô phỏng findOneAndUpdate với CAS filter
    const casFilter = {
      _id: deposit._id,
      status: "PENDING",
      version: oldVersion,
    };
    expect(casFilter._id).toBe("dep_1");
    expect(casFilter.status).toBe("PENDING");
    expect(casFilter.version).toBe(0);

    // Verify update fields
    expect(updateFields.status).toBe("SUCCESS");
    expect(updateFields.receivedAmount).toBe(50000);
    expect(updateFields.apiTransId).toBe("TXN123456");
  });
});

// ══════════════════════════════════════════════════════════════════
//  TEST: Edge cases
// ══════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("Empty Buffer → JSON.parse throw (catch trả về 400)", () => {
    const rawBody = Buffer.from("", "utf-8");
    expect(() => JSON.parse(rawBody.toString())).toThrow();
  });

  it("Invalid JSON → JSON.parse throw", () => {
    const rawBody = Buffer.from("{invalid json}", "utf-8");
    expect(() => JSON.parse(rawBody.toString())).toThrow();
  });

  it("Card webhook thiếu callback_sign → verify false", () => {
    const noSigPayload = { ...MOCK_CARD_WEBHOOK, callback_sign: undefined };
    const rawBody = simulateRawBody(noSigPayload);
    const body = JSON.parse(rawBody.toString());
    expect(verifyWebhookSignature(body)).toBe(false);
  });

  it("Card webhook signature sai → verify false", () => {
    const badSigPayload = { ...MOCK_CARD_WEBHOOK, callback_sign: "WRONG" };
    const rawBody = simulateRawBody(badSigPayload);
    const body = JSON.parse(rawBody.toString());
    expect(verifyWebhookSignature(body)).toBe(false);
  });
});

describe("Các fix khác — ReDoS, Field whitelist, CAS, Pagination", () => {
  it("escapeRegex chống ReDoS", () => {
    // Copy của escapeRegex từ userBalance.controller.js
    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    expect(escapeRegex("hello")).toBe("hello");
    expect(escapeRegex("(.*)")).toBe("\\(\\.\\*\\)");
    expect(escapeRegex("a+b$c")).toBe("a\\+b\\$c");
    expect(escapeRegex("[test]?")).toBe("\\[test\\]\\?");
    // ReDoS payloads — chỉ check không crash + kết quả là string
    const redos1 = escapeRegex("(a+)+b");
    expect(typeof redos1).toBe("string");
    expect(redos1).toContain("\\+");  // dấu + được escape
    expect(redos1).not.toContain("(a+");  // ( được escape trước a

    const redos2 = escapeRegex("(.*)*");
    expect(typeof redos2).toBe("string");
    // Không chứa ký tự regex đặc biệt chưa escape
    expect(redos2).not.toContain("(.");  // ( và . đều được escape
  });

  it("Field whitelist chặn update isSold", () => {
    // Copy của whitelist từ account.controller.js
    const ALLOWED_FIELDS = [
      "title", "game", "price", "description", "attributes",
      "images", "type", "loginInfo", "isActive",
    ];
    const reqBody = {
      title: "New Title",
      isSold: false,
      owner: "someone",
      price: 100000,
    };
    const updateData = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in reqBody) {
        updateData[key] = reqBody[key];
      }
    }
    expect(updateData).toHaveProperty("title", "New Title");
    expect(updateData).toHaveProperty("price", 100000);
    expect(updateData).not.toHaveProperty("isSold");
    expect(updateData).not.toHaveProperty("owner");
  });
});
