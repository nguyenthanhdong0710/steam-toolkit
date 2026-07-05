"use client";

import { Button } from '@/components/ui/button';
import { useState } from "react";

export default function SteamRefreshRequestButton() {
  const [status, setStatus] = useState<string | null>(null);

  const requestRefreshToken = async (twoFactorCode?: string) => {
    const response = await fetch("/api/steam/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...(twoFactorCode ? { twoFactorCode } : {}) }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const error = new Error(payload.error ?? "Failed to create Steam refresh token.");
      (error as Error & { needsTwoFactorCode?: boolean }).needsTwoFactorCode = Boolean(
        payload.needsTwoFactorCode,
      );
      throw error;
    }

    return payload;
  };

  const handleRefreshClick = async () => {
    setStatus("Requesting Steam refresh token...");

    try {
      let payload;

      try {
        payload = await requestRefreshToken();
      } catch (error) {
        if (error instanceof Error && (error as Error & { needsTwoFactorCode?: boolean }).needsTwoFactorCode) {
          const twoFactorCode = window.prompt("Enter your Steam Guard code");

          if (!twoFactorCode) {
            setStatus("Steam Guard code required.");
            return;
          }

          payload = await requestRefreshToken(twoFactorCode.trim());
        } else {
          throw error;
        }
      }

      setStatus("Steam refresh token created.");
      window.prompt("Copy your Steam refresh token", payload.refreshToken);
      console.log("Steam refresh token:", payload.refreshToken);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Steam refresh request failed.");
    }
  };

  return (
    <Button
      onClick={handleRefreshClick}
    >
      {status ?? "Request Refresh Token"}
    </Button>
  );
}