import crypto from "crypto";
import axios from "axios";

const CONFIG = {
  baseUrl: process.env.BASE_URL,
  partnerId: process.env.PARTNER_ID,
  partnerKey: process.env.PARTNER_KEY,
  feeCacheTTL: 10 * 60 * 1000, // Cache fee trong 10 phút
};

/**
 * Tạo MD5 signature theo thứ tự
 * @param {string} str - Chuỗi cần băm
 * @returns {string} - MD5 hash (uppercase)
 */
export const md5 = (str) => {
  return crypto.createHash("md5").update(str).digest("hex").toUpperCase();
};

/**
 * Tạo request_id duy nhất cho mỗi giao dịch
 * Format: R + timestamp (milliseconds)
 */

const generateRequestId = () => {
  return `R${Date.now().toString(36).toUpperCase()}`;
};

export const STATUS_MAP = {
  1: { key: "SUCCESS", success: true, warning: false },
  2: { key: "SUCCESS", success: true, warning: true },
  3: { key: "FAILED", success: false, message: "Thẻ lỗi hoặc đã sử dụng" },
  4: { key: "FAILED", success: false, message: "Hệ thống nhà mạng bảo trì" },
  99: { key: "PENDING", success: false, pending: true },
  100: { key: "FAILED", success: false, message: "Gửi thẻ thất bại" },
};

/**
 * 1. NẠP THẺ (Command: charge)
 * Signature: md5(partner_key + partner_id + serial + pin + amount + request_id)
 */

export const chargeCard = async ({ provider, serial, pin, amount }) => {
  const request_id = generateRequestId();

  const signatureString = `${CONFIG.partnerKey}${CONFIG.partnerId}${serial.toUpperCase().trim()}${pin.trim()}${amount}${request_id}`;
  const sign = md5(signatureString);

  const payload = {
    partner_id: CONFIG.partnerId,
    command: "charge",
    request_id,
    serial: serial.toUpperCase().trim(),
    pin: pin.trim(),
    amount: parseInt(amount),
    provider: provider.toUpperCase(),
    sign,
  };

  try {
    const response = await axios.post(
      `${CONFIG.baseUrl}chargingws/v2`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000, // 30s timeout
      },
    );

    const result = response.data;

    const statusCode = result.status;
    const statusInfo = STATUS_MAP[statusCode] || STATUS_MAP[100];

    const receivedAmount = result.amount || 0;
    const declaredValue = result.declared_value || amount;

    return {
      success: statusInfo.success,
      pending: statusInfo.pending,
      warning: statusInfo.warning,

      code: statusCode,
      message: result.message || statusInfo.label || statusInfo.message,

      transId: result.trans_id,
      requestId: result.request_id,
      receivedAmount, // Số tiền thực tế cộng vào ví
      declaredValue, // Số tiền user khai báo (để so sánh)
      isAmountMismatch: receivedAmount !== declaredValue, // Cảnh báo nếu sai mệnh giá

      telco: result.telco,
      raw: {
        ...result,
        code: "***",
      },
    };
  } catch (error) {
    console.error("Error occurred while charging card:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
    });
    return {
      success: false,
      code: "99",
      message: "Lỗi kết nối nhà cung cấp",
      error: error.message,
      receivedAmount: 0,
      pending: false,
    };
  }
};

/**
 * 2. VERIFY WEBHOOK SIGNATURE
 * Signature: md5(partner_key + code + serial)
 * @param {Object} body - Request body từ NetPay
 * @returns {boolean} - True nếu signature hợp lệ
 */

export const verifyWebhookSignature = (body) => {
  const { callback_sign, code, serial } = body;

  if (!callback_sign || !code || !serial) {
    return false;
  }

  const expectedSign = md5(`${CONFIG.partnerKey}${code}${serial}`);
  return callback_sign === expectedSign;
};

/**
 * 3. PARSE WEBHOOK RESPONSE
 * Chuyển raw webhook data thành format chuẩn cho Controller xử lý
 */

export const parseWebhookData = (body) => {
  const statusCode = body.status;
  const statusInfo = STATUS_MAP[statusCode] || STATUS_MAP[100];

  const receivedAmount = body.amount || 0;
  const declaredValue = body.declared_value || 0;

  return {
    success: statusInfo.success,
    pending: statusInfo.pending,
    warning: statusInfo.warning,

    code: statusCode,
    message: body.message || statusInfo.message || statusInfo.label,

    transId: body.trans_id,
    requestId: body.request_id,
    receivedAmount,
    declaredValue,
    isAmountMismatch: receivedAmount !== declaredValue,

    telco: body.telco,
    raw: { ...body, callback_sign: "***" },
  };
};

// In-memory cache (có thể nâng cấp lên Redis sau này)
let feeCache = {
  data: null,
  timestamp: 0,
  isLoading: false,
};

/**
 * Gọi API lấy danh sách fee từ provider
 */
const fetchFeeFromAPI = async () => {
  try {
    const response = await axios.get(`${CONFIG.baseUrl}chargingws/v2/getfee`, {
      params: {
        partner_id: CONFIG.partnerId,
      },
      timeout: 10000,
    });

    const rawData = response.data;

    const feeMap = new Map();
    for (const item of rawData) {
      const key = `${item.telco}_${item.value}`;
      feeMap.set(key, {
        fees: parseFloat(item.fees), // % phí
        penalty: parseFloat(item.penalty),
        originalValue: parseInt(item.value),
        telco: item.telco,
      });
    }

    console.log(`[CardFee]  Loaded ${feeMap.size} fee configurations`);
    return feeMap;
  } catch (error) {
    console.error("[CardFee] ❌ Failed to fetch fees:", error.message);
    throw error;
  }
};

/**
 * Lấy fee từ cache (nếu còn hạn) hoặc gọi API mới
 */

export const getFeeCache = async () => {
  const now = Date.now();

  // Nếu cache còn hạn → trả về ngay
  if (feeCache.data && now - feeCache.timestamp < CONFIG.feeCacheTTL) {
    return feeCache.data;
  }

  // Nếu đang có request fetch khác → chờ nó hoàn thành (tránh gọi API trùng)

  if (feeCache.isLoading) {
    await new Promise((resolve) => setTimeout(500));
    return feeCache.data || (await getFeeCache()); // Retry sau khi chờ
  }

  // set cờ để xác nhận bắt đầu get cache
  feeCache.isLoading = true;

  try {
    const newData = await fetchFeeFromAPI();
    feeCache = {
      data: newData,
      timestamp: Date.now(),
      isLoading: false,
    };
    return newData;
  } catch (error) {
    feeCache.isLoading = false;

    // Fallback: Nếu cache cũ vẫn còn, trả về tạm (dù hết hạn)
    if (feeCache.data) {
      console.warn("[CardFee] ⚠️ Using stale cache due to API error");
      return feeCache.data;
    }
    throw error;
  }
};

/**
 * Tính số tiền thực nhận dựa trên telco + mệnh giá
 * @param {string} telco - "VIETTEL", "MOBI", ...
 * @param {number} amount - Mệnh giá thẻ (VD: 50000)
 * @returns {Object} { receivedAmount, feePercent, isFound }
 */

export const calculateReceivedAmount = async (telco, amount) => {
  try {
    const feeMap = await getFeeCache();
    const key = `${telco.toUpperCase()}_${amount}`;
    const feeInfo = feeMap.get(key);

    if (feeInfo) {
      const receivedAmount = Math.round((amount * (100 - feeInfo.fees)) / 100);
      return {
        receivedAmount,
        feePercent: feeInfo.fees,
        penalty: feeInfo.penalty,
        isFound: true,
      };
    }

    console.warn(`[CardFee] ⚠️ No fee config for ${key}, using cache`);
    return false;
  } catch (error) {
    console.error(
      "[CardFee] ❌ Calculation error, using fallback:",
      error.message,
    );
    throw new Error();
  }
};

/**
 * API endpoint để frontend gọi lấy fee (optional)
 */
export const getFeeData = async (telco, amount) => {
  const result = await calculateReceivedAmount(telco, amount);
  return {
    success: true,
    telco,
    amount,
    receivedAmount: result.receivedAmount,
    feePercent: result.feePercent,
    message: result.isFound ? "OK" : "Using default rate",
  };
};
