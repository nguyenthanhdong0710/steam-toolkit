export interface ApiErrorBody {
  error: string;
}

export type ApiErrorResponse<
  Extra extends Record<string, unknown> = Record<string, never>,
> = ApiErrorBody & Extra;
