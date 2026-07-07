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

    const { credentialId } = await req.json();

    const { ok } = await callAuthService("/biometric/verify", {
      credentialId,
    });

    return NextResponse.json(ok);
  } catch (error) {
    console.log(error);
    return NextResponse.json(false);
  }
}
