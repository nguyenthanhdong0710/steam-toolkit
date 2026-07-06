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

// POST /api/steam/profile-modifier
export interface EquipProfileModifierRequestBody {
  appid: number;
  communityItemId: string;
}
export interface EquipProfileModifierResponse {
  communityItemId: string;
}
export type EquipProfileModifierErrorResponse = ApiErrorResponse<{
  needsRefreshToken?: boolean;
}>;

// GET /api/cron/profile-theme
export interface CronProfileThemeResponse {
  theme: "day" | "night";
  communityItemId: string;
}
export type CronProfileThemeErrorResponse = ApiErrorResponse<{
  needsRefreshToken?: boolean;
}>;
