import type { ApiResponse, RequestOptions } from "@/types/api/index.js";
import { API_URL } from "../../lib/config/env.ts";
import { useAuthStore } from "@/store/auth-store.ts";

class ApiService {
  private readonly urlPrefix: string;
  private navigationCallback?: () => void;

  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(prefix: string = "") {
    this.urlPrefix = prefix;
  }

  public setNavigationCallback(callback: () => void): void {
    this.navigationCallback = callback;
  }

  public clearNavigationCallback(): void {
    this.navigationCallback = undefined;
  }

  private buildUrl(endpoint: string, options?: RequestOptions): string {
    const base = API_URL;
    if (!base) {
      console.error("API_URL is not defined!");
      throw new Error("Configuration Error: API_URL missing");
    }

    const path = `${this.urlPrefix}${endpoint}`;

    try {
      const url = new URL(path, base);

      if (options?.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });
      }

      return url.toString();
    } catch (e) {
      console.error("Invalid URL construction:", { base, path, full: `${base}${path}` });
      throw e;
    }
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("token");
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  private handleUnauthorized(): void {
    localStorage.clear();

    if (this.navigationCallback) {
      this.navigationCallback();
    } else {
      window.location.href = "/login";
    }
  }

  private async attemptRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (this.isRefreshing) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isRefreshing) {
            clearInterval(checkInterval);
            resolve(!!this.getAuthToken());
          }
        }, 50);
      });
    }

    this.isRefreshing = true;

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.isRefreshing = false;
        this.refreshPromise = null;
        return false;
      }

      try {
        const refreshResponse = await fetch(this.buildUrl("auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            const newAccessToken = refreshData.data.accessToken;
            const newRefreshToken = refreshData.data.refreshToken || refreshToken;

            useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);

            this.isRefreshing = false;
            this.refreshPromise = null;
            return true;
          }
        }
      } catch (e) {
        console.error("RefreshToken Failed", e);
      }

      this.isRefreshing = false;
      this.refreshPromise = null;
      return false;
    })();

    return this.refreshPromise;
  }

  private async request<T>(endpoint: string, method: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options);

      const token = this.getAuthToken();
      const hostname = new URL(window.location.origin);

      const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": `${hostname.origin}`,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options?.headers || {}),
      };

      const response = await fetch(url, {
        method,
        headers,
        credentials: "include",
        signal: AbortSignal.timeout(10000),
        ...options,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshSuccess = await this.attemptRefresh();

          if (refreshSuccess) {
            const newToken = this.getAuthToken();
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };

            const retryResponse = await fetch(url, {
              method,
              headers: retryHeaders,
              credentials: "include",
              signal: AbortSignal.timeout(10000),
              ...options,
            });

            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }

          this.handleUnauthorized();
          return {
            data: null as unknown as T,
            success: false,
            message: "Sesión expirada. Redirigiendo al login...",
          };
        }

        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody && typeof errorBody === "object") {
            if (errorBody.message) {
              errorMessage = errorBody.message;
            } else if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          }
        } catch (_e) {}

        return {
          data: null as unknown as T,
          success: false,
          message: errorMessage,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        data: null as unknown as T,
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  public async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "GET", options);
  }

  public async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "POST", {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PUT", {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "DELETE", options);
  }
}

export const apiService = new ApiService();
