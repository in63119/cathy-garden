export function isImageContentType(contentType: string) {
  return contentType.startsWith("image/");
}

export function isVideoContentType(contentType: string) {
  return contentType.startsWith("video/");
}

export function getMediaKindLabel(contentType: string) {
  if (isImageContentType(contentType)) {
    return "image";
  }

  if (isVideoContentType(contentType)) {
    return "video";
  }

  return "file";
}

export type MediaFilterValue = "all" | "image" | "video" | "favorite";
export type MediaSortValue = "newest" | "oldest";

export function normalizeMediaFilterValue(
  value?: string | null
): MediaFilterValue {
  if (value === "image" || value === "video" || value === "favorite") {
    return value;
  }

  return "all";
}

export function normalizeMediaSortValue(value?: string | null): MediaSortValue {
  if (value === "oldest") {
    return value;
  }

  return "newest";
}

export type SortableMediaEntry = {
  uploadedAt: string;
  takenAt?: string;
  contentType: string;
  fileName: string;
  favorite?: boolean;
  tags?: string[];
  albums?: string[];
};

export function getMediaArchiveDate(
  entry: Pick<SortableMediaEntry, "uploadedAt" | "takenAt">
) {
  return entry.takenAt ?? entry.uploadedAt;
}

export function normalizeMediaSearchQuery(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

export function normalizeMediaTag(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ").slice(0, 32) ?? "";
}

export function normalizeMediaTags(values: string[]) {
  const normalizedTags = values
    .map((value) => normalizeMediaTag(value))
    .filter(Boolean);

  return Array.from(new Set(normalizedTags)).slice(0, 12);
}

export function normalizeMediaTagFilter(value?: string | null) {
  return normalizeMediaTag(value);
}

export function normalizeMediaAlbum(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ").slice(0, 48) ?? "";
}

export function normalizeMediaAlbums(values: string[]) {
  const normalizedAlbums = values
    .map((value) => normalizeMediaAlbum(value))
    .filter(Boolean);

  return Array.from(new Set(normalizedAlbums)).slice(0, 8);
}

export function normalizeMediaAlbumFilter(value?: string | null) {
  return normalizeMediaAlbum(value);
}

export function filterAndSortMediaEntries<T extends SortableMediaEntry>(
  entries: T[],
  options: {
    filter: MediaFilterValue;
    sort: MediaSortValue;
    query?: string;
    tag?: string;
    album?: string;
  }
) {
  const searchQuery = normalizeMediaSearchQuery(options.query).toLocaleLowerCase();
  const tagFilter = normalizeMediaTagFilter(options.tag).toLocaleLowerCase();
  const albumFilter = normalizeMediaAlbumFilter(options.album).toLocaleLowerCase();
  const filtered = entries.filter((entry) => {
    if (options.filter === "all") {
      return (
        matchesSearchQuery(entry, searchQuery) &&
        matchesTag(entry, tagFilter) &&
        matchesAlbum(entry, albumFilter)
      );
    }

    if (options.filter === "favorite") {
      return (
        entry.favorite === true &&
        matchesSearchQuery(entry, searchQuery) &&
        matchesTag(entry, tagFilter) &&
        matchesAlbum(entry, albumFilter)
      );
    }

    return (
      getMediaKindLabel(entry.contentType) === options.filter &&
      matchesSearchQuery(entry, searchQuery) &&
      matchesTag(entry, tagFilter) &&
      matchesAlbum(entry, albumFilter)
    );
  });

  return filtered.sort((left, right) => {
    const compare = getMediaArchiveDate(left).localeCompare(
      getMediaArchiveDate(right)
    );

    return options.sort === "newest" ? -compare : compare;
  });
}

function matchesSearchQuery(
  entry: Pick<SortableMediaEntry, "fileName">,
  searchQuery: string
) {
  if (!searchQuery) {
    return true;
  }

  return entry.fileName.toLocaleLowerCase().includes(searchQuery);
}

function matchesTag(
  entry: Pick<SortableMediaEntry, "tags">,
  tagFilter: string
) {
  if (!tagFilter) {
    return true;
  }

  return (entry.tags ?? []).some(
    (tag) => tag.toLocaleLowerCase() === tagFilter
  );
}

function matchesAlbum(
  entry: Pick<SortableMediaEntry, "albums">,
  albumFilter: string
) {
  if (!albumFilter) {
    return true;
  }

  return (entry.albums ?? []).some(
    (album) => album.toLocaleLowerCase() === albumFilter
  );
}
