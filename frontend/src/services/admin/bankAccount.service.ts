import { api } from "@/lib/adminAxios";
import type {
  BankAccount,
  BankAccountListResponse,
  CreateBankAccountPayload,
  UpdateBankAccountPayload,
  GeneralConfig,
  CardProviderConfig,
} from "@/types/admin/bankAccount.type";

export const bankAccountService = {
  list: async (params?: Record<string, any>) => {
    return await api.get<BankAccountListResponse>("/banks", { params });
  },

  getById: async (id: string) => {
    return await api.get<{ success: boolean; data: BankAccount }>(`/banks/${id}`);
  },

  create: async (payload: CreateBankAccountPayload) => {
    return await api.post<{ success: boolean; data: BankAccount }>("/banks", payload);
  },

  update: async (id: string, payload: UpdateBankAccountPayload) => {
    return await api.put<{ success: boolean; data: BankAccount }>(`/banks/${id}`, payload);
  },

  delete: async (id: string) => {
    return await api.delete<{ success: boolean; message: string }>(`/banks/${id}`);
  },

  toggleActive: async (id: string) => {
    return await api.patch<{ success: boolean; data: BankAccount }>(`/banks/${id}/toggle-active`);
  },
};

export const configService = {
  getGeneral: async () => {
    return await api.get<{ success: boolean; data: GeneralConfig }>("/config/general");
  },

  updateGeneral: async (payload: Partial<GeneralConfig>) => {
    return await api.post<{ success: boolean; message: string; data: Partial<GeneralConfig> }>("/config/general", payload);
  },

  getCardProviders: async () => {
    return await api.get<{ success: boolean; data: CardProviderConfig }>("/config/card-providers");
  },
};
