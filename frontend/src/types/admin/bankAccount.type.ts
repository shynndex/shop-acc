export interface BankAccount {
  _id: string;
  name: string; // "MB Bank", "Vietcombank"
  accountNumber: string;
  accountName: string;
  qrImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountListResponse {
  success: boolean;
  data: {
    banks: BankAccount[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface CreateBankAccountPayload {
  name: string;
  accountNumber: string;
  accountName: string;
  qrImageUrl?: string;
}

export interface UpdateBankAccountPayload {
  name?: string;
  accountNumber?: string;
  accountName?: string;
  qrImageUrl?: string;
}

export interface GeneralConfig {
  siteName: string;
  frontendUrl: string;
  minDeposit: number;
  maxDeposit: number;
  cardProviders: string[];
}

export interface CardProviderConfig {
  isConfigured: boolean;
  partnerId: string;
  baseUrl: string;
  providers: string[];
  feeCacheTTL: string;
}
