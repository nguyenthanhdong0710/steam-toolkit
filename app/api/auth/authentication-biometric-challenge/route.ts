import { NextResponse } from "next/server";

import { callAuthService } from "@/lib/auth-service-client";

export async function POST(req: Request) {
  const { credentialId } = await req.json();

  const { status, data } = await callAuthService("/biometric/auth-challenge", {
    credentialId,
    origin: process.env.NEXT_PUBLIC_BASE_URL,
  });

  return NextResponse.json(data, { status });
}
