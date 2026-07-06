import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api-client";
import { steamKeys } from "@/lib/query-keys";
import type {
  AccountQueryParams,
  AccountResponse,
} from "@/lib/types/steam-api";

export function useAccountSummary(params: AccountQueryParams) {
  return useQuery({
    queryKey: steamKeys.account(params),
    queryFn: ({ signal }) => {
      const search = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, value]) => typeof value === "boolean")
            .map(([key, value]) => [key, String(value)]),
        ),
      );

      return fetchJson<AccountResponse>(
        `/api/steam/account?${search.toString()}`,
        { signal },
      );
    },
  });
}
