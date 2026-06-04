export type ApiResponse<T> = {
  data: T;
  requestId?: string;
  traceId?: string;
};

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  traceId?: string;
};

export type PageState = "idle" | "loading" | "success" | "error";

export type UserRole = "admin" | "manager" | "engineer" | "operator" | "viewer";
