import { api } from "@/lib/adminAxios";
import type {
  AdminListItem,
  AdminListResponse,
  CreateAdminPayload,
  UpdateAdminPayload,
} from "@/types/admin/admin.type";

export const adminManagementService = {
  list: async (params?: Record<string, any>) => {
    // Interceptor unwraps success.data, trả về { admins, totalPages, ... } trực tiếp
    return await api.get<AdminListResponse["data"]>("/admins", { params });
  },

  getById: async (id: string) => {
    // Interceptor unwraps, trả về AdminListItem trực tiếp
    return await api.get<AdminListItem>(`/admins/${id}`);
  },

  create: async (payload: CreateAdminPayload) => {
    // Interceptor unwraps, trả về AdminListItem trực tiếp
    return await api.post<AdminListItem>("/admins", payload);
  },

  update: async (id: string, payload: UpdateAdminPayload) => {
    // Interceptor unwraps, trả về AdminListItem trực tiếp
    return await api.put<AdminListItem>(`/admins/${id}`, payload);
  },

  delete: async (id: string) => {
    return await api.delete<{ success: boolean; message: string }>(`/admins/${id}`);
  },

  toggleStatus: async (id: string) => {
    // Interceptor unwraps, trả về { _id, username, email, role, isActive } (message bị strip)
    return await api.patch<AdminListItem>(
      `/admins/${id}/toggle-status`,
    );
  },
};
