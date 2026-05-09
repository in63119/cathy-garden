import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import { createPresignedContestCaptureUpload } from "@/lib/s3";
import { validateContestCaptureUploadRequest } from "@/lib/upload-policy";

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

  const payload = (body ?? {}) as {
    contentType?: string;
    fileName?: string;
    size?: number;
  };
  const validation = validateContestCaptureUploadRequest(payload);

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.reason },
      { status: validation.reason === "file-too-large" ? 413 : 400 },
    );
  }

  try {
    const presigned = await createPresignedContestCaptureUpload(
      validation.normalized,
    );

    return NextResponse.json(presigned);
  } catch (error) {
    console.error("Failed to create contest capture presigned URL", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { error: "contest-capture-presign-failed" },
      { status: 500 },
    );
  }
}
