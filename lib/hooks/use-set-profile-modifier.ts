import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api-client";
import type {
  EquipProfileModifierRequestBody,
  EquipProfileModifierResponse,
} from "@/lib/types/steam-api";

export function useSetProfileModifier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: EquipProfileModifierRequestBody) =>
      fetchJson<EquipProfileModifierResponse>("/api/steam/profile-modifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steam", "account"] });
    },
  });
}
