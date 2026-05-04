import type { ApiResponse } from "@/types";
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean; // Option để bỏ qua gắn token
  showToast?: boolean; // Option để tắt toast error tự động
}

export const adminApi: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_ADMIN_API_URL || "http://localhost:5001/api/admin",
  withCredentials: true, // 
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

adminApi.interceptors.response.use(
  (response) => response.data, // Auto unwrap .data
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin")
      ) {
        const redirect = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `/admin/login?redirect=${redirect}`;
      }
    }
    return Promise.reject(error);
  },
);

export const api = {
  get: <T = any>(url: string, config?: ApiRequestConfig): Promise<T> =>
    adminApi.get(url, config),

  post: <T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig,
  ): Promise<T> => adminApi.post(url, data, config),

  put: <T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig,
  ): Promise<T> => adminApi.put(url, data, config),

  delete: <T = any>(url: string, config?: ApiRequestConfig): Promise<T> =>
    adminApi.delete(url, config),
};
