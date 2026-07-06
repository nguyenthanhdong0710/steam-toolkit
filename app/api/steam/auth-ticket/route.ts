import { NextResponse } from "next/server";

import { createSteamAuthSessionTicket } from "@/lib/steam-client";
import type {
  AuthTicketErrorResponse,
  AuthTicketResponse,
} from "@/lib/types/steam-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const appId = Number(body.appId ?? 480);

  if (!Number.isInteger(appId) || appId <= 0) {
    return NextResponse.json(
      {
        error: "appId must be a positive integer.",
      } satisfies AuthTicketErrorResponse,
      { status: 400 },
    );
  }

  try {
    const sessionTicket = await createSteamAuthSessionTicket(appId);

    return NextResponse.json({
      appId,
      sessionTicket,
    } satisfies AuthTicketResponse);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Steam auth ticket.";

    if (message === "STEAM_GUARD_REQUIRED") {
      return NextResponse.json(
        {
          error: "Steam Guard code required.",
          needsTwoFactorCode: true,
        } satisfies AuthTicketErrorResponse,
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: message } satisfies AuthTicketErrorResponse,
      { status: 500 },
    );
  }
}
