import type { AccountQueryParams } from "@/lib/types/steam-api";

export const steamKeys = {
  account: (params: AccountQueryParams) =>
    ["steam", "account", params] as const,
};
