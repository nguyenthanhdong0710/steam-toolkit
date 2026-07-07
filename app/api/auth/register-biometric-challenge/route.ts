import { NextResponse } from "next/server";

import { callAuthService } from "@/lib/auth-service-client";

export async function POST(request: Request) {
  const { username, credentialId } = await request.json();

  const { data } = await callAuthService("/biometric/register-challenge", {
    username,
    credentialId,
    origin: process.env.NEXT_PUBLIC_BASE_URL,
  });

  return NextResponse.json(data, { status: 200 });
}
