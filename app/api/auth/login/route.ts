import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";
import {
  AuthApiError,
  authenticateUser,
  loadLoggedUser
} from "@/lib/auth/external-api";
import { writeSessionCookie } from "@/lib/auth/session";
import type { AuthSession } from "@/lib/auth/types";

export const runtime = "nodejs";

type LoginRequestBody = {
  username?: unknown;
  password?: unknown;
};

function fallbackEmail(username: string): string {
  return username.includes("@") ? username : "No email provided";
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: LoginRequestBody;

  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid login payload." },
      { status: 400 }
    );
  }

  // Step 1: validate credentials coming from the login form.
  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, message: "Username and password are required." },
      { status: 400 }
    );
  }

  try {
    // Step 2: authenticate against the external `/login` endpoint and receive token.
    const token = await authenticateUser(username, password);

    // Step 3: load user profile details for the top-bar avatar/name/email.
    const sessionId = authConfig.demoSessionId || randomUUID().toUpperCase();
    const applicationName = authConfig.applicationName;

    const user = await loadLoggedUser({
      token,
      sessionId,
      applicationName,
      username
    }).catch(() => ({
      name: username,
      email: fallbackEmail(username),
      username
    }));

    // Step 4: persist a secure, short-lived, server-side session cookie.
    const session: AuthSession = {
      token,
      sessionId,
      applicationName,
      username,
      user,
      lastActivityAt: Date.now()
    };

    const response = NextResponse.json({ ok: true, user });
    writeSessionCookie(response, session);
    return response;
  } catch (error) {
    if (error instanceof AuthApiError) {
      const unauthorized =
        error.statusCode === 401 || error.statusCode === 403;
      const responseStatus = unauthorized
        ? 401
        : error.statusCode >= 500
          ? 502
          : 400;

      return NextResponse.json(
        {
          ok: false,
          message: unauthorized
            ? "Invalid username or password."
            : error.message
        },
        { status: responseStatus }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
