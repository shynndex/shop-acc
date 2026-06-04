import { api } from "@/lib/adminAxios";

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatedProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
}

export const profileService = {
  /**
   * Cập nhật thông tin cá nhân (username, email)
   * Interceptor unwraps success.data, trả về UpdatedProfile trực tiếp
   */
  updateProfile: async (payload: UpdateProfilePayload) => {
    return await api.put<UpdatedProfile>("/auth/profile", payload);
  },

  /**
   * Đổi mật khẩu
   * Backend trả { success: true, message: "..." } (không có data → interceptor giữ nguyên)
   */
  changePassword: async (payload: ChangePasswordPayload) => {
    return await api.put<{ success: boolean; message: string }>(
      "/auth/profile/password",
      payload,
    );
  },
};
