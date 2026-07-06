"use client";

import { Button } from "@/components/ui/button";
import { useSteamAction } from "@/lib/hooks/use-steam-action";
import type {
  RefreshTokenRequestBody,
  RefreshTokenResponse,
} from "@/lib/types/steam-api";

export default function SteamRefreshRequestButton() {
  const mutation = useSteamAction<
    RefreshTokenRequestBody,
    RefreshTokenResponse
  >("/api/steam/refresh-token");

  const handleRefreshClick = () => {
    mutation.mutate(
      {},
      {
        onSuccess: (data) => {
          window.prompt("Copy your Steam refresh token", data.refreshToken);
        },
      },
    );
  };

  const label = mutation.isPending
    ? "Requesting Steam refresh token..."
    : mutation.isError
      ? mutation.error.message
      : mutation.isSuccess
        ? "Steam refresh token created."
        : "Request Refresh Token";

  return <Button onClick={handleRefreshClick}>{label}</Button>;
}
