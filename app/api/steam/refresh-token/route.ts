import { NextResponse } from "next/server";

import { createSteamRefreshToken } from "@/lib/steam-client";
import type {
  RefreshTokenErrorResponse,
  RefreshTokenResponse,
} from "@/lib/types/steam-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const twoFactorCode =
    typeof body.twoFactorCode === "string" ? body.twoFactorCode.trim() : "";

  try {
    const refreshToken = await createSteamRefreshToken(
      twoFactorCode || undefined,
    );

    return NextResponse.json({ refreshToken } satisfies RefreshTokenResponse);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Steam refresh token.";

    if (message === "STEAM_GUARD_REQUIRED") {
      return NextResponse.json(
        {
          error: "Steam Guard code required.",
          needsTwoFactorCode: true,
        } satisfies RefreshTokenErrorResponse,
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: message } satisfies RefreshTokenErrorResponse,
      { status: 500 },
    );
  }
}
