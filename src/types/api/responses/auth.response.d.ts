export interface LoginWithCodeResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
  };
}
