import { useMutation } from "@tanstack/react-query";

import { ApiRequestError, fetchJson } from "@/lib/api-client";

/**
 * Wraps a POST action that may require a Steam Guard code. On a
 * needsTwoFactorCode error, prompts once for the code and retries.
 */
export function useSteamAction<
  TBody extends { twoFactorCode?: string },
  TSuccess,
>(url: string) {
  const post = (body: TBody) =>
    fetchJson<TSuccess>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  return useMutation({
    mutationFn: async (body: TBody) => {
      try {
        return await post(body);
      } catch (error) {
        if (error instanceof ApiRequestError && error.needsTwoFactorCode) {
          const twoFactorCode = window.prompt("Enter your Steam Guard code");
          if (!twoFactorCode) {
            throw error;
          }
          return await post({ ...body, twoFactorCode: twoFactorCode.trim() });
        }
        throw error;
      }
    },
  });
}
