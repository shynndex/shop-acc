import { api } from "@/lib/axios";
import type {
  BankInfo,
  CardDepositRequest,
  CardDepositResponse,
  FeeCalculationResponse,
  PaymentLinkData,
  PaymentLinkRequest,
} from "@/types/deposit";

export const depositService = {
  /**
   * Tạo Payment Link PayOS
   * @param amount - Số tiền cần nạp (VNĐ)
   */
  createPaymentQR: (amount: number) => {
    const payload: PaymentLinkRequest = { amount };
    return api.post<PaymentLinkData>("/payment/create-payment", payload);
  },

  /**
   * Lấy danh sách ngân hàng đang active
   */
  getActiveBanks: () => {
    return api.get<BankInfo>("/deposits/banks");
  },

  /**
   * Lấy lịch sử nạp tiền của user (có phân trang)
   */

  getHistory: (page: number = 1, limit: number = 10) => {
    return api.get<{ deposits: any[]; totalPages: number }>(
      "/deposits/history",
      { params: { page, limit } },
    );
  },

  /**
   * Lấy thông tin phí nạp thẻ
   */

  calculateFee: async (
    telco: string,
    amount: number,
  ): Promise<FeeCalculationResponse> => {
    const res = await api.get("/payment/calculate-fee", {
      params: { telco: telco.toUpperCase(), amount },
    });
    return res.data;
  },

  /**
   * Gửi yêu cầu nạp thẻ cào
   * @param data - Thông tin thẻ: provider, amount, serial, pin
   */
  submitCardDeposit: async (
    data: CardDepositRequest,
  ): Promise<CardDepositResponse> => {
    const res = await api.post("/payment/create-payment/card", {
      provider: data.provider,
      amount: data.amount,
      serial: data.serial,
      pin: data.pin,
    });
    return res.data;
  },

  // to do
  /**
   * Lấy lịch sử nạp tiền của user
   */
};
