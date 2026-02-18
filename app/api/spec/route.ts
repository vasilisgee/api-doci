import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readActiveServerSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const DEFAULT_SPEC_SOURCE = "public/demo.json";
const REMOTE_SPEC_PATTERN = /^https?:\/\//i;

function resolveSpecSource(): string {
  const source = (process.env.OPENAPI_SPEC_SOURCE ?? "").trim();
  return source || DEFAULT_SPEC_SOURCE;
}

function isRemoteSource(source: string): boolean {
  return REMOTE_SPEC_PATTERN.test(source);
}

function normalizeLocalPath(source: string): string {
  return source.replace(/^[\\/]+/, "");
}

async function loadRemoteSpec(source: string): Promise<string> {
  const response = await fetch(source, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Remote spec request failed with ${response.status}.`);
  }

  return response.text();
}

async function loadLocalSpec(source: string): Promise<string> {
  const projectRoot = path.resolve(process.cwd());
  const absolutePath = path.resolve(projectRoot, normalizeLocalPath(source));

  if (
    absolutePath !== projectRoot &&
    !absolutePath.startsWith(`${projectRoot}${path.sep}`)
  ) {
    throw new Error("Invalid local OpenAPI spec path.");
  }

  return readFile(absolutePath, "utf8");
}

export async function GET(): Promise<NextResponse> {
  const session = await readActiveServerSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const source = resolveSpecSource();

  try {
    const payload = isRemoteSource(source)
      ? await loadRemoteSpec(source)
      : await loadLocalSpec(source);

    const spec = JSON.parse(payload) as unknown;

    return NextResponse.json(spec, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0"
      }
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Unable to load OpenAPI specification."
      },
      { status: 500 }
    );
  }
}
