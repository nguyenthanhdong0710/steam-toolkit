"use client";

import { Button } from "@/components/ui/button";
import { useSteamAction } from "@/lib/hooks/use-steam-action";
import type {
  AuthTicketRequestBody,
  AuthTicketResponse,
} from "@/lib/types/steam-api";

export default function SteamButton() {
  const mutation = useSteamAction<AuthTicketRequestBody, AuthTicketResponse>(
    "/api/steam/auth-ticket",
  );

  const handleSteamClick = () => {
    mutation.mutate({ appId: 480 });
  };

  const label = mutation.isPending
    ? "Requesting Steam ticket..."
    : mutation.isError
      ? mutation.error.message
      : mutation.isSuccess
        ? "Steam ticket created."
        : "Steam";

  return <Button onClick={handleSteamClick}>{label}</Button>;
}
