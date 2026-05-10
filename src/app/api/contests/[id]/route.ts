import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import { deleteContestEntry, updateContestEntry } from "@/lib/contests";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeContestBody(body: unknown) {
  const payload = body as {
    captureImageObjectKey?: unknown;
    captureImageObjectKeys?: unknown;
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
    captureImageObjectKeys: Array.isArray(payload?.captureImageObjectKeys)
      ? payload.captureImageObjectKeys.filter(
          (objectKey): objectKey is string => typeof objectKey === "string",
        )
      : [],
  };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const contest = await updateContestEntry(id, normalizeContestBody(body));

    if (!contest) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return NextResponse.json({ contest });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "invalid-contest-id",
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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const contest = await deleteContestEntry(id);

    if (!contest) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, contest });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-contest-id") {
      return NextResponse.json({ error: "invalid-contest-id" }, { status: 400 });
    }

    throw error;
  }
}
