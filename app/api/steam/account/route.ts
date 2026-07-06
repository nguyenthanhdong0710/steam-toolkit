import { NextResponse } from "next/server";

import { getAccountSummary } from "@/lib/steam-client";
import type {
  AccountErrorResponse,
  AccountResponse,
} from "@/lib/types/steam-api";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeSensitive =
      url.searchParams.get("includeSensitive") === "true";
    const includeOwnedApps =
      url.searchParams.get("includeOwnedApps") === "true";
    const includeFriendsList =
      url.searchParams.get("includeFriendsList") === "true";
    const includeGroupsList =
      url.searchParams.get("includeGroupsList") === "true";
    const includeInventory =
      url.searchParams.get("includeInventory") === "true";

    const account = await getAccountSummary({
      includeSensitive,
      includeOwnedApps,
      includeFriendsList,
      includeGroupsList,
      includeInventory,
    });

    return NextResponse.json(account satisfies AccountResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message === "STEAM_REFRESH_TOKEN_MISSING" ||
      message === "STEAM_REFRESH_TOKEN_INVALID"
    ) {
      return NextResponse.json(
        {
          error: "Steam refresh token is missing or invalid.",
          needsRefreshToken: true,
        } satisfies AccountErrorResponse,
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: message } satisfies AccountErrorResponse,
      { status: 500 },
    );
  }
}
