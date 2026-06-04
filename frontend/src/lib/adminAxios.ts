import type { ApiResponse } from "@/types";
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  showToast?: boolean;
}

export const adminApi: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_ADMIN_API_URL || "http://localhost:5001/api/admin",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ─── Refresh token queue ──────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  originalRequest: InternalAxiosRequestConfig;
}[] = [];

function onRefreshed() {
  refreshSubscribers.forEach(({ resolve, originalRequest }) =>
    resolve(adminApi(originalRequest)),
  );
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers.forEach(({ reject, originalRequest }) =>
    reject(new AxiosError("Refresh token failed", "401", originalRequest)),
  );
  refreshSubscribers = [];
}

async function attemptTokenRefresh(): Promise<boolean> {
  try {
    await adminApi.post("/auth/refresh");
    // Admin auth uses httpOnly cookies (admin_token + admin_refresh),
    // not Bearer tokens. The cookies are auto-updated by the response.
    return true;
  } catch {
    return false;
  }
}

// ─── Track redirect ─────────────────────────────────────────────────
let isRedirecting = false;
let redirectTimer: ReturnType<typeof setTimeout> | null = null;

const REDIRECT_COOLDOWN = 5000;

function redirectToLogin() {
  if (isRedirecting) return;
  if (window.location.pathname === "/admin/login") return;

  isRedirecting = true;

  const redirect = encodeURIComponent(
    window.location.pathname + window.location.search,
  );

  if (redirectTimer) clearTimeout(redirectTimer);

  redirectTimer = setTimeout(() => {
    isRedirecting = false;
  }, REDIRECT_COOLDOWN);

  window.location.href = `/admin/login?redirect=${redirect}`;
}

adminApi.interceptors.response.use(
  (response) => {
    const res = response.data;

    if (res?.success !== undefined) {
      if (!res.success) {
        return Promise.reject(res);
      }
      return res.data !== undefined ? res.data : res;
    }

    return res;
  },
  (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/me") &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin")
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        attemptTokenRefresh().then((success) => {
          isRefreshing = false;

          if (success) {
            onRefreshed();
          } else {
            onRefreshFailed();

            import("sonner").then(({ toast }) => {
              toast.error(
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
                {
                  duration: 4000,
                  onAutoClose: () => redirectToLogin(),
                  onDismiss: () => redirectToLogin(),
                },
              );

              setTimeout(() => {
                redirectToLogin();
              }, 6000);
            }).catch(() => {
              redirectToLogin();
            });
          }
        });
      }

      return new Promise((resolve, reject) => {
        refreshSubscribers.push({ resolve, reject, originalRequest });
      });
    }

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin") &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/me")
    ) {
      import("sonner").then(({ toast }) => {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
          duration: 4000,
          onAutoClose: () => redirectToLogin(),
          onDismiss: () => redirectToLogin(),
        });

        setTimeout(() => {
          redirectToLogin();
        }, 6000);
      }).catch(() => {
        redirectToLogin();
      });
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

  patch: <T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig,
  ): Promise<T> => adminApi.patch(url, data, config),

  delete: <T = any>(url: string, config?: ApiRequestConfig): Promise<T> =>
    adminApi.delete(url, config),
};
