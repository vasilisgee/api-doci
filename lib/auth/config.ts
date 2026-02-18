import "server-only";

const DEFAULT_INACTIVITY_MINUTES = 30;
const DEFAULT_LOGIN_MIN_SUBMIT_MS = 1200;
const DEFAULT_APPLICATION_NAME = "com.lapp.flutter";
const DEV_FALLBACK_SECRET = "replace-this-development-only-auth-secret";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsedValue = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function normalizeBaseUrl(value: string | undefined): string {
  const trimmedValue = (value ?? "").trim();
  if (!trimmedValue) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `http://${trimmedValue}`;

  return withProtocol.replace(/\/+$/, "");
}

const sessionSecret =
  (process.env.AUTH_SESSION_SECRET ?? "").trim() || DEV_FALLBACK_SECRET;

if (
  process.env.NODE_ENV === "production" &&
  sessionSecret === DEV_FALLBACK_SECRET
) {
  throw new Error("AUTH_SESSION_SECRET must be set in production.");
}

export const authConfig = {
  apiBaseUrl: normalizeBaseUrl(process.env.AUTH_API_BASE_URL),
  applicationName:
    (process.env.AUTH_APPLICATION_NAME ?? "").trim() ||
    DEFAULT_APPLICATION_NAME,
  demoSessionId: (process.env.AUTH_DEMO_SESSION_ID ?? "").trim(),
  sessionCookieName:
    (process.env.AUTH_SESSION_COOKIE_NAME ?? "").trim() ||
    "api_doci_auth",
  sessionSecret,
  inactivityMinutes: parsePositiveInt(
    process.env.SESSION_INACTIVITY_MINUTES,
    DEFAULT_INACTIVITY_MINUTES
  ),
  loginMinSubmitMs: parsePositiveInt(
    process.env.LOGIN_MIN_SUBMIT_MS,
    DEFAULT_LOGIN_MIN_SUBMIT_MS
  ),
  secureCookies: process.env.NODE_ENV === "production"
} as const;

export const inactivityTimeoutMs = authConfig.inactivityMinutes * 60_000;
