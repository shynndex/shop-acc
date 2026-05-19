// src/types/deposit.ts

import type { ApiResponse } from ".";

export type DepositStatus =
  | "PENDING"
  | "PAID" // Bank
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface BankInfo {
  _id: string;
  name: string;
  accountNumber: string;
  accountName: string;
  qrImageUrl?: string;
  isActive: boolean;
}

export interface PaymentLinkRequest {
  amount: number;
}

export interface PaymentLinkData {
  bankName: string;
  qrImage: string;
  accountName: string;
  accountNumber: string;
  referenceCode: string;
  minDeposit: number;
  instruction: string;
}

export interface DepositStatusData {
  _id: string;
  depositId: string;
  orderCode: number;
  amount: number;
  status: DepositStatus;
  paidAt?: string;
  transactionData?: Record<string, any>;
}

// 🔹 Type cho các API response cụ thể
export type CreatePaymentLinkResponse = ApiResponse<PaymentLinkData>;
export type CheckDepositStatusResponse = ApiResponse<DepositStatusData>;
export type GetBanksResponse = ApiResponse<BankInfo[]>;

// 🔹 Props cho component
export interface DepositDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (amount: number) => void;
  onCancel?: () => void;
}

// 🔹 State nội bộ của DepositDialog
export interface DepositDialogState {
  paymentStep: "input" | "waiting" | "success" | "error";
  bankAmount: string;
  paymentInfo: PaymentLinkData | null;
  referenceCode: string | null;
  loading: boolean;
  error: string | null;
}

export interface DepositSSEData {
  type: "bank" | "card";
  depositId: string;
  status: DepositStatus;
  amount: number;
  message: string;
  timestamp: string;
  referenceCode?: string;
  isAmountMismatch?: boolean;
  provider?: string;
}

export interface CardDepositRequest {
  provider: string;
  amount: number;
  serial: string;
  pin: string;
}

export interface CardDepositResponse {
  success: boolean;
  message: string;
  data: {
    depositId: string;
    status: "PENDING" | "PAID" | "FAILED";
    requestId: string;
  };
}

export interface FeeCalculationResponse {
  success: boolean;
  telco: string;
  amount: number;
  receivedAmount: number;
  feePercent: number;
  message: string;
}

export interface DepositStatusResponse {
  success: boolean;
  data: {
    status: "PENDING" | "FAILED";
    message: string;
    receivedAmount?: number;
    isAmountMismatch?: boolean;
  };
}
