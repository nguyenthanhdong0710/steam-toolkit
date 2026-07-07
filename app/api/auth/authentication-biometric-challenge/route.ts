import { NextResponse } from "next/server";

import { callAuthService } from "@/lib/auth-service-client";

export async function POST(req: Request) {
  if (process.env.USE_EXTERNAL_AUTH_SERVICE !== "true") {
    return NextResponse.json(
      { error: "External auth service is disabled" },
      { status: 404 },
    );
  }

  const { credentialId } = await req.json();

  const { status, data } = await callAuthService("/biometric/auth-challenge", {
    credentialId,
    origin: process.env.NEXT_PUBLIC_BASE_URL,
  });

  return NextResponse.json(data, { status });
}
