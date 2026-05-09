import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import {
  readContestIdeaMemo,
  writeContestIdeaMemo,
} from "@/lib/contest-ideas";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeMemoPayload(body: unknown) {
  const memo = ((body as { memo?: unknown } | null)?.memo ?? "").toString();

  return memo.slice(0, 10000);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const ideaMemo = await readContestIdeaMemo(id);

    return NextResponse.json({ ideaMemo });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-contest-id") {
      return NextResponse.json({ error: "invalid-contest-id" }, { status: 400 });
    }

    throw error;
  }
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
    const ideaMemo = await writeContestIdeaMemo({
      contestId: id,
      memo: normalizeMemoPayload(body),
    });

    return NextResponse.json({ ideaMemo });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-contest-id") {
      return NextResponse.json({ error: "invalid-contest-id" }, { status: 400 });
    }

    throw error;
  }
}
