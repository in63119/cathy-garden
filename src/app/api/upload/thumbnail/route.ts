import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import { createPresignedThumbnailUpload } from "@/lib/s3";

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

  const objectKey = ((body as { objectKey?: unknown } | null)?.objectKey ?? "")
    .toString()
    .trim();

  if (!objectKey.startsWith("uploads/")) {
    return NextResponse.json(
      { error: "invalid-thumbnail-source-key" },
      { status: 400 }
    );
  }

  try {
    const presigned = await createPresignedThumbnailUpload({ objectKey });

    return NextResponse.json(presigned);
  } catch (error) {
    console.error("Failed to create S3 presigned thumbnail URL", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { error: "thumbnail-presign-failed" },
      { status: 500 }
    );
  }
}
