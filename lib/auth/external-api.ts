import "server-only";

import { authConfig } from "@/lib/auth/config";
import type { AuthenticatedUser } from "@/lib/auth/types";

type JsonObject = Record<string, unknown>;

export class AuthApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
  }
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonObject;
}

function joinUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

function extractMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  const record = asObject(payload);
  if (!record) {
    return null;
  }

  const keys = [
    "message",
    "Message",
    "error",
    "Error",
    "error_description",
    "ErrorMessage",
    "ExceptionMessage"
  ];

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function postAuth(path: string, body: JsonObject): Promise<unknown> {
  if (!authConfig.apiBaseUrl) {
    throw new AuthApiError("AUTH_API_BASE_URL is not configured.", 500);
  }

  const response = await fetch(joinUrl(authConfig.apiBaseUrl, path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const rawText = await response.text();
  let payload: unknown = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const message =
      extractMessage(payload) ??
      `Auth API request failed with status ${response.status}.`;
    throw new AuthApiError(message, response.status);
  }

  return payload;
}

function firstString(source: JsonObject | null, keys: string[]): string {
  if (!source) {
    return "";
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function resolveLoggedUserPayload(payload: unknown): JsonObject | null {
  const root = asObject(payload);
  if (!root) {
    return null;
  }

  const candidates: unknown[] = [
    root.GetLoggedUserResult,
    root.LoginUserResult,
    root.GetUserResult,
    root.User,
    root.user,
    root
  ];

  for (const candidate of candidates) {
    const parsed = asObject(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function toDisplayName(userPayload: JsonObject | null, username: string): string {
  const firstName = firstString(userPayload, ["FirstName", "firstName"]);
  const lastName = firstString(userPayload, ["LastName", "lastName"]);
  const combinedName = `${firstName} ${lastName}`.trim();

  if (combinedName) {
    return combinedName;
  }

  const directName = firstString(userPayload, [
    "PersonFullName",
    "FullName",
    "DisplayName",
    "displayName",
    "Name",
    "name"
  ]);

  if (directName) {
    return directName;
  }

  // Avoid showing identical "name + email" when API has no proper display name.
  if (username.includes("@")) {
    return username.split("@")[0];
  }

  return username;
}

function toEmail(userPayload: JsonObject | null, username: string): string {
  const resolvedEmail = firstString(userPayload, [
    "Email",
    "email",
    "UserEmail",
    "userEmail"
  ]);

  if (resolvedEmail) {
    return resolvedEmail;
  }

  return username.includes("@") ? username : "No email provided";
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<string> {
  const payload = await postAuth("login", { username, password });
  const root = asObject(payload);
  const tokenValue = root?.LoginResult ?? root?.token ?? root?.Token;

  if (typeof tokenValue !== "string" || !tokenValue.trim()) {
    throw new AuthApiError("Login succeeded but no token was returned.", 502);
  }

  return tokenValue.trim();
}

type LoggedUserParams = {
  token: string;
  sessionId: string;
  applicationName: string;
  username: string;
};

export async function loadLoggedUser(
  params: LoggedUserParams
): Promise<AuthenticatedUser> {
  const payload = await postAuth("GetLoggedUser", {
    token: params.token,
    sessionId: params.sessionId,
    applicationName: params.applicationName
  });

  const userPayload = resolveLoggedUserPayload(payload);

  return {
    name: toDisplayName(userPayload, params.username),
    email: toEmail(userPayload, params.username),
    username: params.username
  };
}

type LogoutParams = {
  token: string;
  sessionId: string;
  applicationName: string;
};

export async function revokeUserSession(params: LogoutParams): Promise<void> {
  try {
    await postAuth("LogoutUser", {
      token: params.token,
      sessionId: params.sessionId,
      applicationName: params.applicationName
    });
  } catch {
    // Logout should always clear local session even if upstream call fails.
  }
}
