import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import { createContestEntry, readContestEntries } from "@/lib/contests";

function normalizeContestBody(body: unknown) {
  const payload = body as {
    captureImageObjectKey?: unknown;
    deadline?: unknown;
    prize?: unknown;
    title?: unknown;
  } | null;

  return {
    title: typeof payload?.title === "string" ? payload.title : "",
    deadline: typeof payload?.deadline === "string" ? payload.deadline : "",
    prize: typeof payload?.prize === "string" ? payload.prize : "",
    captureImageObjectKey:
      typeof payload?.captureImageObjectKey === "string"
        ? payload.captureImageObjectKey
        : "",
  };
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contests = await readContestEntries();

  return NextResponse.json({ contests });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  try {
    const contest = await createContestEntry(normalizeContestBody(body));

    return NextResponse.json({ contest });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "invalid-contest",
        "invalid-contest-deadline",
        "invalid-contest-capture-key",
      ].includes(error.message)
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
