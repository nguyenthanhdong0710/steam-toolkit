import { NextResponse } from "next/server";

import { setSteamProfileModifier } from "@/lib/steam-client";
import type {
  EquipProfileModifierErrorResponse,
  EquipProfileModifierResponse,
} from "@/lib/types/steam-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const communityItemId = body.communityItemId;
  const appid = Number(body.appid);

  if (
    typeof communityItemId !== "string" ||
    communityItemId.trim().length === 0
  ) {
    return NextResponse.json(
      {
        error: "communityItemId must be a non-empty string.",
      } satisfies EquipProfileModifierErrorResponse,
      { status: 400 },
    );
  }

  if (!Number.isInteger(appid) || appid <= 0) {
    return NextResponse.json(
      {
        error: "appid must be a positive integer.",
      } satisfies EquipProfileModifierErrorResponse,
      { status: 400 },
    );
  }

  try {
    await setSteamProfileModifier(appid, communityItemId);

    return NextResponse.json({
      communityItemId,
    } satisfies EquipProfileModifierResponse);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to equip profile modifier.";

    if (
      message === "STEAM_REFRESH_TOKEN_MISSING" ||
      message === "STEAM_REFRESH_TOKEN_INVALID"
    ) {
      return NextResponse.json(
        {
          error: "Steam refresh token is missing or invalid.",
          needsRefreshToken: true,
        } satisfies EquipProfileModifierErrorResponse,
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: message } satisfies EquipProfileModifierErrorResponse,
      { status: 500 },
    );
  }
}
