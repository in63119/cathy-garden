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

  const objectKeys = contest.captureImageObjectKeys ?? [
    contest.captureImageObjectKey,
  ];
  const images = await Promise.all(
    objectKeys.map(async (objectKey) => ({
      objectKey,
      imageUrl: await createPresignedDownload({ objectKey }),
    })),
  );

  return NextResponse.json({
    imageUrl: images[0]?.imageUrl ?? null,
    objectKey: images[0]?.objectKey ?? contest.captureImageObjectKey,
    images,
  });
}
