import { NextResponse } from "next/server";

import { callAuthService } from "@/lib/auth-service-client";

export async function POST(req: Request) {
  try {
    if (process.env.USE_EXTERNAL_AUTH_SERVICE !== "true") {
      return NextResponse.json(
        { error: "External auth service is disabled" },
        { status: 404 },
      );
    }

    const { username, credential } = await req.json();

    const { status, data } = await callAuthService(
      "/biometric/verify-registration",
      { username, credential, origin: process.env.NEXT_PUBLIC_BASE_URL },
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error);
    return NextResponse.json("Unknown error for verify your identity", {
      status: 500,
    });
  }
}
