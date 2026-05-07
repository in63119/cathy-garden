import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import { validateCompleteUploadPayload } from "@/lib/media-metadata";
import { createMediaEntry } from "@/lib/media-store";

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

  const validation = validateCompleteUploadPayload(
    (body ?? {}) as Record<string, unknown>
  );

  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const entry = await createMediaEntry(validation.normalized);

  return NextResponse.json({
    entry,
  });
}
