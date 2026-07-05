"use client"

import { useState } from "react";
import { Button } from '@/components/ui/button';

export default function SteamButton() {
  const [status, setStatus] = useState<string | null>(null);

  const requestSteamTicket = async (twoFactorCode?: string) => {
    const response = await fetch("/api/steam/auth-ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appId: 480, ...(twoFactorCode ? { twoFactorCode } : {}) }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const error = new Error(payload.error ?? "Failed to create Steam auth ticket.");
      (error as Error & { needsTwoFactorCode?: boolean }).needsTwoFactorCode = Boolean(
        payload.needsTwoFactorCode,
      );
      throw error;
    }

    return payload;
  };

  const handleSteamClick = async () => {
    setStatus("Requesting Steam ticket...");

    try {
      let payload;

      try {
        payload = await requestSteamTicket();
      } catch (error) {
        if (error instanceof Error && (error as Error & { needsTwoFactorCode?: boolean }).needsTwoFactorCode) {
          const twoFactorCode = window.prompt("Enter your Steam Guard code");

          if (!twoFactorCode) {
            setStatus("Steam Guard code required.");
            return;
          }

          payload = await requestSteamTicket(twoFactorCode.trim());
        } else {
          throw error;
        }
      }

      setStatus("Steam ticket created.");
      console.log(payload);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Steam request failed.");
    }
  };

  return <Button
    onClick={handleSteamClick}
  >
    {status ?? "Steam"}
  </Button>
}