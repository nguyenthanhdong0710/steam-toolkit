import { NextResponse } from "next/server";

import { setSteamProfileModifier } from "@/lib/steam-client";
import type {
  CronProfileThemeErrorResponse,
  CronProfileThemeResponse,
} from "@/lib/types/steam-api";

export const runtime = "nodejs";

// appid/communityitemid pulled from the "Summer in the City" theme in
// app/ProfileThemePicker.tsx's defaultThemes — keep these in sync if that changes.
const PROFILE_THEME_APPID = 2459330;
const PROFILE_THEME_COMMUNITY_ITEM_IDS = {
  day: "39015937990",
  night: "39015938039",
} as const;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized." } satisfies CronProfileThemeErrorResponse,
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme");

  if (theme !== "day" && theme !== "night") {
    return NextResponse.json(
      {
        error: 'theme query param must be "day" or "night".',
      } satisfies CronProfileThemeErrorResponse,
      { status: 400 },
    );
  }

  const communityItemId = PROFILE_THEME_COMMUNITY_ITEM_IDS[theme];

  try {
    await setSteamProfileModifier(PROFILE_THEME_APPID, communityItemId);

    return NextResponse.json({
      theme,
      communityItemId,
    } satisfies CronProfileThemeResponse);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to equip profile theme.";

    if (
      message === "STEAM_REFRESH_TOKEN_MISSING" ||
      message === "STEAM_REFRESH_TOKEN_INVALID"
    ) {
      return NextResponse.json(
        {
          error: "Steam refresh token is missing or invalid.",
          needsRefreshToken: true,
        } satisfies CronProfileThemeErrorResponse,
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: message } satisfies CronProfileThemeErrorResponse,
      { status: 500 },
    );
  }
}
