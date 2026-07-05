import { NextResponse } from "next/server";
import { createSteamAuthSessionTicket } from "@/lib/steam-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const appId = Number(body.appId ?? 480);

  if (!Number.isInteger(appId) || appId <= 0) {
    return NextResponse.json(
      { ok: false, error: "appId must be a positive integer." },
      { status: 400 },
    );
  }

  try {
    const sessionTicket = await createSteamAuthSessionTicket(appId);

    return NextResponse.json({ ok: true, appId, sessionTicket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Steam auth ticket.";

    if (message === "STEAM_GUARD_REQUIRED") {
      return NextResponse.json(
        { ok: false, error: "Steam Guard code required.", needsTwoFactorCode: true },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}