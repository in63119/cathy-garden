import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import {
  addContestSubmission,
  readContestSubmissionArchive,
} from "@/lib/contest-submissions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeSubmissionPayload(body: unknown): {
  name: string;
  type: "file" | "youtube";
  objectKey: string;
  url: string;
} | null {
  const payload = body as {
    name?: unknown;
    objectKey?: unknown;
    type?: unknown;
    url?: unknown;
  } | null;
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const type = payload?.type === "youtube" ? "youtube" : "file";
  const objectKey =
    typeof payload?.objectKey === "string" ? payload.objectKey.trim() : "";
  const url = typeof payload?.url === "string" ? payload.url.trim() : "";

  if (!name || (type === "file" && !objectKey) || (type === "youtube" && !url)) {
    return null;
  }

  return {
    name: name.slice(0, 160),
    type,
    objectKey: objectKey.slice(0, 1024),
    url: url.slice(0, 1024),
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const archive = await readContestSubmissionArchive(id);

    return NextResponse.json({ archive });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-contest-id") {
      return NextResponse.json({ error: "invalid-contest-id" }, { status: 400 });
    }

    throw error;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const submission = normalizeSubmissionPayload(body);

  if (!submission) {
    return NextResponse.json({ error: "invalid-submission" }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const archive = await addContestSubmission({
      contestId: id,
      ...submission,
    });

    return NextResponse.json({ archive });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-contest-id") {
      return NextResponse.json({ error: "invalid-contest-id" }, { status: 400 });
    }

    throw error;
  }
}
