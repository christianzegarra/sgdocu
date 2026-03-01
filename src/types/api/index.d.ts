export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}
