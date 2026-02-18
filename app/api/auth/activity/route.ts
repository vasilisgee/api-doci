import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  isSessionExpired,
  readSessionFromCookies,
  touchSession,
  writeSessionCookie
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = readSessionFromCookies(request.cookies);

  if (!session || isSessionExpired(session)) {
    const expiredResponse = NextResponse.json(
      { ok: false, message: "Session expired." },
      { status: 401 }
    );
    clearSessionCookie(expiredResponse);
    return expiredResponse;
  }

  const response = NextResponse.json({ ok: true });
  writeSessionCookie(response, touchSession(session));
  return response;
}
