import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import { cookies } from "next/headers";
import { type NextResponse } from "next/server";
import { authConfig, inactivityTimeoutMs } from "@/lib/auth/config";
import type { AuthSession } from "@/lib/auth/types";

const COOKIE_VERSION = "v1";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

function getSessionKey(): Buffer {
  return createHash("sha256").update(authConfig.sessionSecret).digest();
}

function encodeBase64Url(data: Buffer): string {
  return data.toString("base64url");
}

function decodeBase64Url(data: string): Buffer {
  return Buffer.from(data, "base64url");
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthSession>;

  return (
    typeof candidate.token === "string" &&
    typeof candidate.sessionId === "string" &&
    typeof candidate.applicationName === "string" &&
    typeof candidate.username === "string" &&
    typeof candidate.lastActivityAt === "number" &&
    !!candidate.user &&
    typeof candidate.user.name === "string" &&
    typeof candidate.user.email === "string" &&
    typeof candidate.user.username === "string"
  );
}

function encryptSession(session: AuthSession): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getSessionKey(), iv);
  const payload = Buffer.from(JSON.stringify(session), "utf8");

  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    COOKIE_VERSION,
    encodeBase64Url(iv),
    encodeBase64Url(authTag),
    encodeBase64Url(encrypted)
  ].join(".");
}

function decryptSession(value: string): AuthSession | null {
  try {
    const [version, ivEncoded, authTagEncoded, encryptedEncoded] =
      value.split(".");

    if (
      version !== COOKIE_VERSION ||
      !ivEncoded ||
      !authTagEncoded ||
      !encryptedEncoded
    ) {
      return null;
    }

    const iv = decodeBase64Url(ivEncoded);
    const authTag = decodeBase64Url(authTagEncoded);
    const encrypted = decodeBase64Url(encryptedEncoded);

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      return null;
    }

    const decipher = createDecipheriv("aes-256-gcm", getSessionKey(), iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString("utf8")) as unknown;

    if (!isAuthSession(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isSessionExpired(session: AuthSession, now = Date.now()): boolean {
  return now - session.lastActivityAt > inactivityTimeoutMs;
}

export function readSessionFromCookies(cookieStore: CookieReader): AuthSession | null {
  const rawCookie = cookieStore.get(authConfig.sessionCookieName)?.value;
  if (!rawCookie) {
    return null;
  }

  return decryptSession(rawCookie);
}

export async function readServerSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  return readSessionFromCookies(cookieStore);
}

export async function readActiveServerSession(): Promise<AuthSession | null> {
  const session = await readServerSession();
  if (!session || isSessionExpired(session)) {
    return null;
  }

  return session;
}

export function writeSessionCookie(response: NextResponse, session: AuthSession): void {
  response.cookies.set(authConfig.sessionCookieName, encryptSession(session), {
    httpOnly: true,
    secure: authConfig.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(inactivityTimeoutMs / 1000)
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(authConfig.sessionCookieName, "", {
    httpOnly: true,
    secure: authConfig.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function touchSession(session: AuthSession): AuthSession {
  return {
    ...session,
    lastActivityAt: Date.now()
  };
}
