import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import {
  deleteMediaEntryById,
  updateMediaEntryFavorite,
} from "@/lib/media-store";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deletedEntry = await deleteMediaEntryById(id);

  if (!deletedEntry) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.json({
    deleted: true,
    entry: deletedEntry,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const favorite = (body as { favorite?: unknown } | null)?.favorite;

  if (typeof favorite !== "boolean") {
    return NextResponse.json({ error: "invalid-favorite" }, { status: 400 });
  }

  const { id } = await context.params;
  const entry = await updateMediaEntryFavorite(id, favorite);

  if (!entry) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.json({
    entry,
  });
}
