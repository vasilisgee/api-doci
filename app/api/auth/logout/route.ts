import { NextRequest, NextResponse } from "next/server";
import { revokeUserSession } from "@/lib/auth/external-api";
import {
  clearSessionCookie,
  isSessionExpired,
  readSessionFromCookies
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = readSessionFromCookies(request.cookies);

  if (session && !isSessionExpired(session)) {
    await revokeUserSession({
      token: session.token,
      sessionId: session.sessionId,
      applicationName: session.applicationName
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
