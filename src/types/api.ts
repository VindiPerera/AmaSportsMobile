/** Envelope shape returned by every backend endpoint (see backend ApiResponse trait). */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Normalized error shape thrown by the API client for callers to consume. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly errors: Record<string, string[]> | null;

  constructor(message: string, status: number | null = null, errors: Record<string, string[]> | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  /** First validation message, useful for single-line toasts. */
  get firstFieldError(): string | null {
    if (!this.errors) return null;
    const firstKey = Object.keys(this.errors)[0];
    return firstKey ? this.errors[firstKey][0] : null;
  }
}
