export type DepositType = "bank" | "card";
export type DepositStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export interface BankDepositInfo {
  bankName?: string;
  accountNumber?: number;
  accountHolder?: string;
  referenceCode?: string; // Mã tham chiếu chuyển khoản
}

export interface CardDepositInfo {
  provider?: string;
  serial?: string;
  pin?: string;
  declaredValue?: number; // Mệnh giá user khai báo
  receivedValue?: number; // Số tiền thực nhận sau phí
}

export interface Deposit {
  _id: string;
  userId: string;
  userUserName?: string;
  userEmail?: string;
  type: DepositType;
  amount: number; // Số tiền thực nhận
  fee?: number; // Phí giao dịch (cho card)
  status: DepositStatus;
  bankInfo?: BankDepositInfo;
  cardInfo?: CardDepositInfo;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositListResponse {
  success: boolean;
  data: {
    deposits: Deposit[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface UpdateDepositStatusPayload {
  status: DepositStatus;
  adminNote?: string;
}
