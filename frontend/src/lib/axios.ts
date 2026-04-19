import type { ApiResponse } from "@/types";
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean; // Option để bỏ qua gắn token
  showToast?: boolean; // Option để tắt toast error tự động
}

const apiClient: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Interceptor: Tự động gắn Token vào mọi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Hoặc lấy từ Zustand/Auth store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor: Xử lý lỗi tập trung
apiClient.interceptors.response.use(
  (response) => {
    const res = response.data; // ApiResponse<T>

    if (!res.success) {
      return Promise.reject(res);
    }

    return res.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Xử lý lỗi 401 Token hết hạn → Đăng xuất
      localStorage.removeItem("token");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      // toast.error("Bạn không có quyền truy cập");
    }

    // Xử lý lỗi 404, 500...
    if (error.response?.status === 404) {
      // toast.error("Không tìm thấy tài nguyên");
    }
    return Promise.reject(
      error.response?.data || error.message || "Có lỗi xảy ra",
    );
  },
);

export const api = {
  get: <T = any>(url: string, config?: ApiRequestConfig): Promise<T> =>
    apiClient.get(url, config),

  post: <T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig,
  ): Promise<T> => apiClient.post(url, data, config),

  put: <T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig,
  ): Promise<T> => apiClient.put(url, data, config),

  delete: <T = any>(url: string, config?: ApiRequestConfig): Promise<T> =>
    apiClient.delete(url, config),
};

export default apiClient;
