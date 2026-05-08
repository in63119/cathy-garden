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
};

export function getMediaArchiveDate(
  entry: Pick<SortableMediaEntry, "uploadedAt" | "takenAt">
) {
  return entry.takenAt ?? entry.uploadedAt;
}

export function normalizeMediaSearchQuery(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

export function filterAndSortMediaEntries<T extends SortableMediaEntry>(
  entries: T[],
  options: {
    filter: MediaFilterValue;
    sort: MediaSortValue;
    query?: string;
  }
) {
  const searchQuery = normalizeMediaSearchQuery(options.query).toLocaleLowerCase();
  const filtered = entries.filter((entry) => {
    if (options.filter === "all") {
      return matchesSearchQuery(entry, searchQuery);
    }

    if (options.filter === "favorite") {
      return entry.favorite === true && matchesSearchQuery(entry, searchQuery);
    }

    return (
      getMediaKindLabel(entry.contentType) === options.filter &&
      matchesSearchQuery(entry, searchQuery)
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
