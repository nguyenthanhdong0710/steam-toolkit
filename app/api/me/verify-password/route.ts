import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { callAuthService } from "@/lib/auth-service-client";

export async function POST(request: NextRequest) {
  try {
    const { password }: { password: string } = await request.json();
    if (!password) throw new Error("Password required");

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const username = token?.username as string | undefined;
    if (!username) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (process.env.USE_EXTERNAL_AUTH_SERVICE !== "true") {
      return NextResponse.json(password === process.env.STEAM_PASSWORD);
    }

    const { ok } = await callAuthService<{ id: string; username: string }>(
      "/verify-password",
      { username, password },
    );

    return NextResponse.json(ok);
  } catch (error) {
    console.error("Error verify password:", error);
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 },
    );
  }
}
