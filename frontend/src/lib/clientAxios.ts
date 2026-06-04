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

// ─── Refresh token queue ──────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  originalRequest: InternalAxiosRequestConfig;
}[] = [];

function onRefreshed() {
  refreshSubscribers.forEach(({ resolve, originalRequest }) =>
    resolve(apiClient(originalRequest)),
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
    const response = await apiClient.post<{ accessToken: string }>("/auth/refresh-token");
    if (response?.accessToken) {
      updateStoredToken(response.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Track redirect ─────────────────────────────────────────────────
let isRedirecting = false;
let redirectTimer: ReturnType<typeof setTimeout> | null = null;

const REDIRECT_COOLDOWN = 5000;

function redirectToSignin() {
  if (isRedirecting) return;
  if (window.location.pathname === "/signin") return;

  isRedirecting = true;

  if (redirectTimer) clearTimeout(redirectTimer);

  redirectTimer = setTimeout(() => {
    isRedirecting = false;
  }, REDIRECT_COOLDOWN);

  window.location.href = "/signin";
}

// ─── Update stored access token after refresh ───────────────────────
function updateStoredToken(newToken: string) {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        parsed.state.accessToken = newToken;
        localStorage.setItem("auth-storage", JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore parse errors
  }
}

// Interceptor: Tự động gắn Token vào mọi request
apiClient.interceptors.request.use(
  (config) => {
    const rawStore = localStorage.getItem("auth-storage");
    let token: string | null = null;
    if (rawStore) {
      try {
        const parsed = JSON.parse(rawStore);
        token = parsed.state?.accessToken || null;
      } catch {
        // ignore parse errors
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor: Xử lý lỗi tập trung + Refresh token
apiClient.interceptors.response.use(
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

    // ── Attempt token refresh on 401 ────────────────────────────────
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token") &&
      !originalRequest.url?.includes("/auth/sign-in") &&
      !originalRequest.url?.includes("/auth/sign-up") &&
      !originalRequest.url?.includes("/auth/sign-out") &&
      !originalRequest.url?.includes("/auth/forgot-password") &&
      !originalRequest.url?.includes("/auth/reset-password")
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        attemptTokenRefresh().then((success) => {
          isRefreshing = false;

          if (success) {
            // Đọc accessToken mới từ response (backend trả về { accessToken })
            // Cập nhật vào localStorage để request retry dùng token mới
            onRefreshed();
          } else {
            onRefreshFailed();

            // Xoá auth state
            localStorage.removeItem("auth-storage");

            import("sonner").then(({ toast }) => {
              toast.error(
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
                {
                  duration: 4000,
                  onAutoClose: () => redirectToSignin(),
                  onDismiss: () => redirectToSignin(),
                },
              );

              setTimeout(() => {
                redirectToSignin();
              }, 6000);
            }).catch(() => {
              redirectToSignin();
            });
          }
        });
      }

      return new Promise((resolve, reject) => {
        refreshSubscribers.push({ resolve, reject, originalRequest });
      });
    }

    // ── Fallback: 401 on auth endpoints (refresh, login, etc.) ──────
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes("/auth/refresh-token") &&
      !originalRequest.url?.includes("/auth/sign-in") &&
      !originalRequest.url?.includes("/auth/sign-up") &&
      !originalRequest.url?.includes("/auth/sign-out") &&
      !originalRequest.url?.includes("/auth/forgot-password") &&
      !originalRequest.url?.includes("/auth/reset-password")
    ) {
      localStorage.removeItem("auth-storage");

      import("sonner").then(({ toast }) => {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
          duration: 4000,
          onAutoClose: () => redirectToSignin(),
          onDismiss: () => redirectToSignin(),
        });

        setTimeout(() => {
          redirectToSignin();
        }, 6000);
      }).catch(() => {
        redirectToSignin();
      });
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
