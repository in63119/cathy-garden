import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import { createPresignedUpload } from "@/lib/s3";
import { validateUploadRequest } from "@/lib/upload-policy";

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
    fileName?: string;
    contentType?: string;
    size?: number;
  };

  const validation = validateUploadRequest(payload);

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.reason },
      { status: validation.reason === "file-too-large" ? 413 : 400 }
    );
  }

  try {
    const presigned = await createPresignedUpload(validation.normalized);

    return NextResponse.json({
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      bucket: presigned.bucket,
      region: presigned.region,
      expiresIn: presigned.expiresIn,
      contentType: validation.normalized.contentType,
      fileName: validation.normalized.fileName,
      size: validation.normalized.size,
    });
  } catch (error) {
    console.error("Failed to create S3 presigned upload URL", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { error: "presign-failed" },
      { status: 500 }
    );
  }
}
