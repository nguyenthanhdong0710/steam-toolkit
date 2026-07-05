import { NextResponse } from "next/server";
import { createSteamRefreshToken } from "@/lib/steam-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const twoFactorCode = typeof body.twoFactorCode === "string" ? body.twoFactorCode.trim() : "";

  try {
    const refreshToken = await createSteamRefreshToken(twoFactorCode || undefined);

    return NextResponse.json({ ok: true, refreshToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Steam refresh token.";

    if (message === "STEAM_GUARD_REQUIRED") {
      return NextResponse.json(
        { ok: false, error: "Steam Guard code required.", needsTwoFactorCode: true },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}