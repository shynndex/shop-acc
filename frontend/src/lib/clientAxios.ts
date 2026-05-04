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
    const rawStore = localStorage.getItem("auth-storage");
    let token: string | null = null;
    if (rawStore) {
      try {
        const parsed = JSON.parse(rawStore);
        // Zustand persist lưu: { state: { accessToken: "...", ... }, version: 0 }
        token = parsed.state?.accessToken || null;
      } catch (error) {
        // Nếu parse lỗi, bỏ qua
      }
    }
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

    if (res?.success !== undefined) {
      if (!res.success) {
        return Promise.reject(res);
      }
      // Nếu có field "data", unwrap; ngược lại trả toàn bộ res (cho case chỉ có message)
      return res.data !== undefined ? res.data : res;
    }
    // Với response không có "success" (account list, webhooks...), trả nguyên vẹn
    return res;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Xử lý lỗi 401 Token hết hạn → Đăng xuất
      localStorage.removeItem("auth-storage");
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
