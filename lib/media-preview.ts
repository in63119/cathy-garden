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

export type MediaFilterValue = "all" | "image" | "video";
export type MediaSortValue = "newest" | "oldest";

export function normalizeMediaFilterValue(
  value?: string | null
): MediaFilterValue {
  if (value === "image" || value === "video") {
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
};

export function getMediaArchiveDate(
  entry: Pick<SortableMediaEntry, "uploadedAt" | "takenAt">
) {
  return entry.takenAt ?? entry.uploadedAt;
}

export function filterAndSortMediaEntries<T extends SortableMediaEntry>(
  entries: T[],
  options: {
    filter: MediaFilterValue;
    sort: MediaSortValue;
  }
) {
  const filtered = entries.filter((entry) => {
    if (options.filter === "all") {
      return true;
    }

    return getMediaKindLabel(entry.contentType) === options.filter;
  });

  return filtered.sort((left, right) => {
    const compare = getMediaArchiveDate(left).localeCompare(
      getMediaArchiveDate(right)
    );

    return options.sort === "newest" ? -compare : compare;
  });
}
