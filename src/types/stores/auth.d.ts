export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: LoggedUser | null;
  isAuthenticated: boolean;
  setAuthenticatedUser: (tokens: { accessToken: string; refreshToken: string }) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  updateSessionInfo: (user: LoggedUser) => void;
  logout: () => void;
}
