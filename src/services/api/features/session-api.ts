import type { ApiResponse } from "@/types/api/index.js";
import { apiService } from "../index.ts";
import type { LoggedUser } from "@/types/entities/user.js";

export class SessionApi {
  public async getSessionInfo(): Promise<ApiResponse<LoggedUser>> {
    return apiService.get<LoggedUser>("/session/me");
  }
}
