import type { ApiErrorResponse } from "./api";
import type { AccountSummary } from "./steam-account";

// GET /api/steam/account
export interface AccountQueryParams {
  includeSensitive?: boolean;
  includeOwnedApps?: boolean;
  includeFriendsList?: boolean;
  includeGroupsList?: boolean;
  includeInventory?: boolean;
}
export type AccountResponse = AccountSummary;
export type AccountErrorResponse = ApiErrorResponse<{
  needsRefreshToken?: boolean;
}>;

// POST /api/steam/auth-ticket
export interface AuthTicketRequestBody {
  appId?: number;
  twoFactorCode?: string;
}
export interface AuthTicketResponse {
  appId: number;
  sessionTicket: string;
}
export type AuthTicketErrorResponse = ApiErrorResponse<{
  needsTwoFactorCode?: boolean;
}>;

// POST /api/steam/refresh-token
export interface RefreshTokenRequestBody {
  twoFactorCode?: string;
}
export interface RefreshTokenResponse {
  refreshToken: string;
}
export type RefreshTokenErrorResponse = ApiErrorResponse<{
  needsTwoFactorCode?: boolean;
}>;
