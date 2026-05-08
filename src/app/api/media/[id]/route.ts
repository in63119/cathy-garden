import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth-server";
import {
  deleteMediaEntryById,
  updateMediaEntryAlbums,
  updateMediaEntryFavorite,
  updateMediaEntrySharing,
  updateMediaEntryTags,
} from "@/lib/media-store";
import {
  normalizeMediaAlbums,
  normalizeMediaTags,
} from "@/lib/media-preview";

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

  const payload = body as {
    albums?: unknown;
    favorite?: unknown;
    shareEnabled?: unknown;
    tags?: unknown;
  } | null;
  const albums = payload?.albums;
  const favorite = payload?.favorite;
  const shareEnabled = payload?.shareEnabled;
  const tags = payload?.tags;

  if (typeof favorite === "boolean") {
    const { id } = await context.params;
    const entry = await updateMediaEntryFavorite(id, favorite);

    if (!entry) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return NextResponse.json({
      entry,
    });
  }

  if (typeof shareEnabled === "boolean") {
    const { id } = await context.params;
    const entry = await updateMediaEntrySharing(id, shareEnabled);

    if (!entry) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return NextResponse.json({
      entry,
    });
  }

  if (Array.isArray(tags) && tags.every((tag) => typeof tag === "string")) {
    const { id } = await context.params;
    const entry = await updateMediaEntryTags(id, normalizeMediaTags(tags));

    if (!entry) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return NextResponse.json({
      entry,
    });
  }

  if (
    Array.isArray(albums) &&
    albums.every((album) => typeof album === "string")
  ) {
    const { id } = await context.params;
    const entry = await updateMediaEntryAlbums(id, normalizeMediaAlbums(albums));

    if (!entry) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return NextResponse.json({
      entry,
    });
  }

  if (albums !== undefined) {
    return NextResponse.json({ error: "invalid-albums" }, { status: 400 });
  }

  if (shareEnabled !== undefined) {
    return NextResponse.json({ error: "invalid-share" }, { status: 400 });
  }

  if (tags !== undefined) {
    return NextResponse.json({ error: "invalid-tags" }, { status: 400 });
  }

  if (favorite !== undefined) {
    return NextResponse.json({ error: "invalid-favorite" }, { status: 400 });
  }

  return NextResponse.json({ error: "invalid-patch" }, { status: 400 });
}
