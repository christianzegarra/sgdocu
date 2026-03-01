import type { ApiResponse } from "@/types/api/index.js";
import { apiService } from "../index.ts";

export class AuthApi {
  public async sendVerificationCode(email: string): Promise<ApiResponse<void>> {
    return apiService.post<void>("/auth/send-verification-code", { email });
  }

  public async verifyEmailCode(email: string | null, code: string): Promise<ApiResponse<void>> {
    return apiService.post<void>("/auth/verify-email-code", { email, code });
  }
}
export const authApi = new AuthApi();
