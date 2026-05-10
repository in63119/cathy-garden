import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import { readContestEntries } from "@/lib/contests";
import { createPresignedDownload } from "@/lib/s3";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const contests = await readContestEntries();
  const contest = contests.find((contestEntry) => contestEntry.id === id);

  if (!contest) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const imageUrl = await createPresignedDownload({
    objectKey: contest.captureImageObjectKey,
  });

  return NextResponse.json({
    imageUrl,
    objectKey: contest.captureImageObjectKey,
  });
}
