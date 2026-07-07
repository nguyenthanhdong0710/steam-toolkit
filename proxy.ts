import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "";

  if (authorization) {
    const headerCronSecret = authorization.replaceAll("Bearer ", "");
    if (cronSecret === headerCronSecret) {
      return NextResponse.next();
    }
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/api/:path((?!auth/|cron/).*)"],
};
