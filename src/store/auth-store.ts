import type { LoggedUser } from "@/types/entities/user";
import type { AuthState } from "@/types/stores/auth";
import { create } from "zustand";

const getInitialToken = () => {
  const storageData = localStorage.getItem("token");
  return storageData || null;
};

const getInitialRefreshToken = () => {
  const storageData = localStorage.getItem("refreshToken");
  return storageData || null;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getInitialToken(),
  refreshToken: getInitialRefreshToken(),
  user: null,
  isAuthenticated: !!getInitialToken(),

  setAuthenticatedUser: ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({ token: accessToken, refreshToken, isAuthenticated: true });
  },

  updateTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({ token: accessToken, refreshToken });
  },

  updateSessionInfo: (user: LoggedUser) => set({ user }),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));
