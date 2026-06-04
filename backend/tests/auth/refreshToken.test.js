/**
 * Unit tests for Refresh Token Rotation
 *
 * Tests the auth controller's refresh token lifecycle:
 *   - Normal token rotation (refresh → new tokens)
 *   - Theft detection (reused token → all sessions invalidated)
 *   - Token validation errors
 *   - Cookie handling on login + logout
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Shared mock fns (vi.hoisted avoids hoisting issues with vi.mock) ──────
const mockCrypto = vi.hoisted(() => ({
  randomBytes: vi.fn(),
  createHash: vi.fn(),
}));

const mockJwt = vi.hoisted(() => ({
  sign: vi.fn(),
  verify: vi.fn(),
}));

// Must use the SAME vi.fn() in both `default` and named exports so that
// `import crypto from "crypto"` (default) and `import * as crypto from "crypto"`
// (named) both hit the same mock instance.
vi.mock("crypto", () => ({
  default: mockCrypto,
  randomBytes: mockCrypto.randomBytes,
  createHash: mockCrypto.createHash,
}));

vi.mock("jsonwebtoken", () => ({
  default: mockJwt,
  sign: mockJwt.sign,
  verify: mockJwt.verify,
}));

// Mock speakeasy — no external variable (avoids hoisting traps)
vi.mock("speakeasy", () => ({
  default: {
    totp: { verify: vi.fn().mockReturnValue(true) },
    generateSecret: vi.fn(() => ({
      base32: "MOCKBASE32SECRET",
      otpauth_url:
        "otpauth://totp/ShopAccLQ:admin@test.com?secret=MOCKBASE32SECRET",
    })),
  },
  totp: { verify: vi.fn().mockReturnValue(true) },
  generateSecret: vi.fn(() => ({
    base32: "MOCKBASE32SECRET",
    otpauth_url:
      "otpauth://totp/ShopAccLQ:admin@test.com?secret=MOCKBASE32SECRET",
  })),
}));

// Mock Admin model — must support .select() chaining for mongoose queries.
const { mockAdminFindOne, mockAdminFindById } = vi.hoisted(() => {
  const m1 = vi.fn();
  const m2 = vi.fn();
  return { mockAdminFindOne: m1, mockAdminFindById: m2 };
});

vi.mock("../../src/models/admin/Admin.model.js", () => ({
  default: Object.assign(
    function Admin(data) {
      return { ...data, save: vi.fn().mockResolvedValue(this) };
    },
    {
      findOne: (...args) => {
        const result = mockAdminFindOne(...args);
        return { select: vi.fn(() => result) };
      },
      findById: (...args) => {
        const result = mockAdminFindById(...args);
        return { select: vi.fn(() => result) };
      },
    },
  ),
}));

// Mock audit service
vi.mock("../../src/services/adminAudit.service.js", () => ({
  logAdminAction: vi.fn(),
}));

// Mock cookie config
const mockCookieOptions = {
  httpOnly: true,
  path: "/api/admin",
  maxAge: 900000,
};

const mockRefreshCookieOptions = {
  httpOnly: true,
  path: "/api/admin/auth/refresh",
  maxAge: 604800000,
};

vi.mock("../../src/libs/cookie.config.js", () => ({
  getCookieOptions: vi.fn(() => mockCookieOptions),
  getRefreshCookieOptions: vi.fn(() => mockRefreshCookieOptions),
}));

// ── Import controller (after mocks are set up) ────────────────────────────
import * as crypto from "crypto";
import { logAdminAction } from "../../src/services/adminAudit.service.js";
import {
  refresh,
  login,
  logout,
  verifyTwoFactorLogin,
} from "../../src/controllers/admin/auth.controller.js";
import { AppError } from "../../src/middlewares/errorHandler.js";

// ── Test Helpers ──────────────────────────────────────────────────────────

function createMockReqRes(overrides = {}) {
  const cookieStore = {};
  const req = {
    cookies: {},
    ip: "127.0.0.1",
    body: {},
    admin: null,
    ...overrides,
  };

  const res = {
    statusCode: 200,
    _json: null,
    json: vi.fn(function (data) {
      this._json = data;
      return this;
    }),
    status: vi.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    cookie: vi.fn(function (name, value, options) {
      cookieStore[name] = { value, options };
      return this;
    }),
    clearCookie: vi.fn(function (name, options) {
      delete cookieStore[name];
      return this;
    }),
    _cookies: cookieStore,
  };

  return { req, res };
}

function setupCryptoMocks() {
  const rawTokenHex =
    "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
  const newRawTokenHex =
    "f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6";
  const hashHex = "abc123hashhashhashhashhashhashhashhash123";
  const newHashHex = "def456hashhashhashhashhashhashhashhash456";

  const mockRandomBytes = vi.mocked(crypto.randomBytes);
  const mockCreateHash = vi.mocked(crypto.createHash);

  mockRandomBytes.mockReset();
  mockCreateHash.mockReset();

  const digestMock1 = vi.fn().mockReturnValue(hashHex);
  const digestMock2 = vi.fn().mockReturnValue(newHashHex);

  mockRandomBytes
    .mockReturnValueOnce({ toString: () => rawTokenHex })
    .mockReturnValueOnce({ toString: () => newRawTokenHex });

  const hashMock1 = {
    update: vi.fn().mockReturnValue({ digest: digestMock1 }),
  };
  const hashMock2 = {
    update: vi.fn().mockReturnValue({ digest: digestMock2 }),
  };
  mockCreateHash
    .mockReturnValueOnce(hashMock1)
    .mockReturnValueOnce(hashMock2);

  return { rawTokenHex, newRawTokenHex, hashHex, newHashHex };
}

/**
 * Run an asyncHandler-wrapped controller with proper error propagation.
 *
 * asyncHandler doesn't return a promise (no `return` on the catch), so we
 * provide `next` and re-throw any caught error.  Because asyncHandler's
 * .catch() fires in a *microtask* (not synchronously), we drain the microtask
 * queue with setTimeout(0) before checking caughtError.
 */
async function runController(controllerFn, req, res) {
  let caughtError = null;
  const next = (err) => {
    caughtError = err;
  };
  controllerFn(req, res, next);

  // Drain the microtask queue so asyncHandler's .catch(next) has fired.
  await new Promise((resolve) => setTimeout(resolve, 0));

  if (caughtError) {
    throw caughtError;
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_ADMIN_SECRET = "test-secret-key";
});

describe("Refresh Token Rotation", () => {
  describe("normal refresh flow", () => {
    it("should rotate tokens successfully when valid refresh token is provided", async () => {
      const { rawTokenHex, hashHex, newHashHex } = setupCryptoMocks();

      const admin = {
        _id: "admin123",
        username: "testadmin",
        email: "admin@test.com",
        role: "admin",
        isActive: true,
        refreshToken: hashHex,
        refreshTokenUsed: [],
        save: vi.fn().mockResolvedValue(true),
      };

      mockAdminFindOne.mockResolvedValue(admin);
      mockJwt.sign.mockReturnValue("new-access-token-123");

      const { req, res } = createMockReqRes({
        cookies: { admin_refresh: rawTokenHex },
      });

      await runController(refresh, req, res);

      // old token moved to used
      expect(admin.refreshTokenUsed).toContain(hashHex);
      // new hash assigned
      expect(admin.refreshToken).toBe(newHashHex);
      expect(admin.save).toHaveBeenCalled();

      // new cookies set
      expect(res.cookie).toHaveBeenCalledWith(
        "admin_token",
        "new-access-token-123",
        mockCookieOptions,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "admin_refresh",
        expect.any(String),
        mockRefreshCookieOptions,
      );

      // response
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Token đã được làm mới",
      });

      // audit log
      expect(logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: "admin:session:refresh" }),
      );
    });

    it("should track up to 5 used tokens in rotation history", async () => {
      const { rawTokenHex, hashHex } = setupCryptoMocks();

      const existingUsed = ["old1", "old2", "old3", "old4", "old5"];
      const admin = {
        _id: "admin123",
        username: "testadmin",
        email: "admin@test.com",
        role: "admin",
        refreshToken: hashHex,
        refreshTokenUsed: [...existingUsed],
        save: vi.fn().mockResolvedValue(true),
      };

      mockAdminFindOne.mockResolvedValue(admin);
      mockJwt.sign.mockReturnValue("token");

      const { req, res } = createMockReqRes({
        cookies: { admin_refresh: rawTokenHex },
      });

      await runController(refresh, req, res);

      // Should keep at 5 (old1 dropped, hashHex added)
      expect(admin.refreshTokenUsed.length).toBe(5);
      expect(admin.refreshTokenUsed).toContain(hashHex);
      expect(admin.refreshTokenUsed).not.toContain("old1");
    });
  });

  describe("theft detection", () => {
    it("should invalidate all sessions when a rotated token is reused", async () => {
      const { rawTokenHex, hashHex } = setupCryptoMocks();

      const admin = {
        _id: "admin123",
        username: "testadmin",
        email: "admin@test.com",
        role: "admin",
        isActive: true,
        refreshToken: "current-hash",
        refreshTokenUsed: [hashHex, "other-old-token"],
        save: vi.fn().mockResolvedValue(true),
      };

      mockAdminFindOne.mockResolvedValue(admin);

      const { req, res } = createMockReqRes({
        cookies: { admin_refresh: rawTokenHex },
      });

      await expect(runController(refresh, req, res)).rejects.toThrow(
        AppError,
      );

      // All tokens cleared
      expect(admin.refreshToken).toBeNull();
      expect(admin.refreshTokenUsed).toEqual([]);
      expect(admin.save).toHaveBeenCalled();

      // Cookies cleared
      expect(res.clearCookie).toHaveBeenCalledWith("admin_token", {
        path: "/api/admin",
      });
      expect(res.clearCookie).toHaveBeenCalledWith("admin_refresh", {
        path: "/api/admin",
      });

      // Theft audit log
      expect(logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "admin:session:theft_detected",
          details: expect.objectContaining({ reason: "refresh_token_reuse" }),
        }),
      );
    });
  });

  describe("error handling", () => {
    it("should return 401 when no refresh token cookie is present", async () => {
      const { req, res } = createMockReqRes({ cookies: {} });

      await expect(runController(refresh, req, res)).rejects.toThrow(
        "Không tìm thấy refresh token",
      );
    });

    it("should return 401 when refresh token is not found in DB", async () => {
      const { rawTokenHex } = setupCryptoMocks();

      mockAdminFindOne.mockResolvedValue(null);

      const { req, res } = createMockReqRes({
        cookies: { admin_refresh: rawTokenHex },
      });

      await expect(runController(refresh, req, res)).rejects.toThrow(
        "Refresh token không hợp lệ",
      );
    });

    it("should include 401 status code in AppError", async () => {
      const { req, res } = createMockReqRes({ cookies: {} });

      try {
        await runController(refresh, req, res);
        expect("code").toBe("unreachable");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
        expect(err.isOperational).toBe(true);
      }
    });
  });
});

describe("issueTokens (via login/2FA)", () => {
  it("should set refresh token in DB and cookies after login (no 2FA)", async () => {
    setupCryptoMocks();
    mockJwt.sign.mockReturnValue("access-token-123");

    const admin = {
      _id: "admin123",
      username: "testadmin",
      email: "admin@test.com",
      role: "admin",
      isActive: true,
      password: "hashed-password",
      totpEnabled: false,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLogin: null,
      loginIP: null,
      refreshToken: null,
      refreshTokenUsed: [],
      save: vi.fn().mockResolvedValue(true),
      matchPassword: vi.fn().mockResolvedValue(true),
    };

    mockAdminFindOne.mockResolvedValue(admin);

    const { req, res } = createMockReqRes({
      body: { email: "admin@test.com", password: "correct-password" },
    });

    await runController(login, req, res);

    // Login succeeded
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );

    // admin.save was called (which includes refreshToken write)
    expect(admin.save).toHaveBeenCalled();

    // Cookies were set
    expect(res.cookie).toHaveBeenCalledWith(
      "admin_token",
      expect.any(String),
      expect.any(Object),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "admin_refresh",
      expect.any(String),
      expect.any(Object),
    );
  });

  it("should issue tokens after successful 2FA verification", async () => {
    setupCryptoMocks();
    mockJwt.sign.mockReturnValue("access-token-456");
    mockJwt.verify.mockReturnValue({
      id: "admin123",
      purpose: "2fa-login",
    });

    const admin = {
      _id: "admin123",
      username: "testadmin",
      email: "admin@test.com",
      role: "admin",
      isActive: true,
      totpEnabled: true,
      totpSecret: "BASE32SECRET",
      lastLogin: null,
      loginIP: null,
      refreshToken: null,
      refreshTokenUsed: [],
      save: vi.fn().mockResolvedValue(true),
    };

    mockAdminFindById.mockResolvedValue(admin);

    const { req, res } = createMockReqRes({
      body: { tempToken: "valid-temp-token", totpCode: "123456" },
    });

    await runController(verifyTwoFactorLogin, req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
    expect(admin.save).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      "admin_refresh",
      expect.any(String),
      expect.any(Object),
    );
  });
});

describe("logout", () => {
  it("should clear both access and refresh cookies on logout", async () => {
    const { req, res } = createMockReqRes({
      admin: {
        _id: "admin123",
        username: "testadmin",
        email: "admin@test.com",
      },
    });

    await logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith("admin_token", {
      path: "/api/admin",
    });
    expect(res.clearCookie).toHaveBeenCalledWith("admin_refresh", {
      path: "/api/admin",
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Đăng xuất thành công",
    });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin:logout",
        adminName: "testadmin",
      }),
    );
  });
});
