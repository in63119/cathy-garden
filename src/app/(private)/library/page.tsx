import { DeleteMediaButton } from "@/components/delete-media-button";
import { FavoriteMediaButton } from "@/components/favorite-media-button";
import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { readMediaEntries } from "@/lib/media-store";
import {
  filterAndSortMediaEntries,
  getMediaArchiveDate,
  getMediaKindLabel,
  isImageContentType,
  isVideoContentType,
  normalizeMediaFilterValue,
  normalizeMediaSortValue,
} from "@/lib/media-preview";
import { createPresignedDownload } from "@/lib/s3";

function formatUploadedAt(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildLibraryHref(params: { filter: string; sort: string }) {
  return `/library?filter=${encodeURIComponent(params.filter)}&sort=${encodeURIComponent(
    params.sort
  )}`;
}

type LibraryPageProps = {
  searchParams?: Promise<{
    filter?: string;
    sort?: string;
    uploaded?: string;
    uploadedCount?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const filter = normalizeMediaFilterValue(params?.filter);
  const sort = normalizeMediaSortValue(params?.sort);
  const uploaded = params?.uploaded?.trim() ?? "";
  const uploadedCount = Number(params?.uploadedCount ?? "0");
  const entries = await readMediaEntries();
  const visibleEntries = filterAndSortMediaEntries(entries, { filter, sort });
  const entriesWithPreview = await Promise.all(
    visibleEntries.map(async (entry) => {
      const mediaKind = getMediaKindLabel(entry.contentType);
      const archiveDateLabel = entry.takenAt ? "Taken" : "Uploaded";

      return {
        ...entry,
        mediaKind,
        archiveDateLabel,
        previewUrl:
          mediaKind === "image"
            ? await createPresignedDownload({
                bucket: entry.bucket,
                objectKey: entry.objectKey,
                contentType: entry.contentType,
              })
            : null,
      };
    })
  );

  return (
    <div className="content-shell page-section">
      <SectionCard
        eyebrow="Library"
        title="The media library now reflects uploaded archive entries."
        description="This page reads saved upload metadata, supports basic filtering, and keeps the preview load light for video items."
      >
        {uploaded ? (
          <div className="card-soft panel-success" style={{ display: "grid", gap: "6px", padding: "16px", lineHeight: 1.6 }}>
            <strong>Upload complete</strong>
            {uploadedCount > 1 ? (
              <span>
                <code>{uploadedCount}</code> files were added to the archive. The
                latest item is <code>{uploaded}</code>.
              </span>
            ) : (
              <span>
                <code>{uploaded}</code> is now part of the archive.
              </span>
            )}
          </div>
        ) : null}

        <div className="filter-toolbar">
          <div className="filter-cluster">
            {(["all", "favorite", "image", "video"] as const).map((option) => (
              <Link
                key={option}
                href={buildLibraryHref({ filter: option, sort })}
                className={`button-link secondary${filter === option ? " is-active" : ""}`}
              >
                {option === "all"
                  ? "All"
                  : option === "favorite"
                    ? "Favorites"
                    : option === "image"
                      ? "Photos"
                      : "Videos"}
              </Link>
            ))}
          </div>

          <div className="filter-cluster">
            {(["newest", "oldest"] as const).map((option) => (
              <Link
                key={option}
                href={buildLibraryHref({ filter, sort: option })}
                className={`button-link secondary${sort === option ? " is-active" : ""}`}
              >
                {option === "newest" ? "Newest first" : "Oldest first"}
              </Link>
            ))}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="panel panel-dashed panel-muted">
            No uploaded items yet. Use the upload route to add the first photo
            or video to the archive.
          </div>
        ) : entriesWithPreview.length === 0 ? (
          <div className="panel panel-dashed panel-muted">
            No items match the current filter.
          </div>
        ) : (
          <div className="library-grid">
            {entriesWithPreview.map((entry) => (
              <article
                key={entry.id}
                className="card-soft media-card"
              >
                <div className="media-card-figure">
                  {isImageContentType(entry.contentType) ? (
                    <img
                      src={entry.previewUrl ?? ""}
                      alt={entry.fileName}
                      className="media-card-image"
                    />
                  ) : null}
                  {isVideoContentType(entry.contentType) ? (
                    <Link
                      href={`/media/${entry.id}`}
                      className="media-card-video-link"
                    >
                      <div style={{ display: "grid", placeItems: "center" }}>
                        <div className="media-card-play">▶</div>
                      </div>
                      <div className="media-card-video-copy">
                        <strong style={{ fontSize: "0.98rem", lineHeight: 1.4 }}>
                          Video keeps its full quiet moment.
                        </strong>
                        <span style={{ fontSize: "0.84rem", opacity: 0.86, lineHeight: 1.5 }}>
                          Open the detail page to watch the signed original.
                        </span>
                      </div>
                    </Link>
                  ) : null}
                  {!isImageContentType(entry.contentType) &&
                  !isVideoContentType(entry.contentType) ? (
                    <span style={{ color: "var(--muted)", fontWeight: 700 }}>
                      No preview available
                    </span>
                  ) : null}
                </div>
                <div className="media-card-body">
                  <div className="media-card-meta">
                    <span className="media-chip">
                      {entry.mediaKind === "image" ? "Photo" : "Video"}
                    </span>
                    {entry.favorite ? (
                      <span className="media-chip">Favorite</span>
                    ) : null}
                    <span className="media-chip">
                      {entry.archiveDateLabel}{" "}
                      {formatUploadedAt(getMediaArchiveDate(entry))}
                    </span>
                  </div>
                  <h2 className="media-card-title">{entry.fileName}</h2>
                  <p className="media-card-caption">
                    {entry.mediaKind === "image"
                      ? "A preserved photo in the private garden archive."
                      : "A quiet video entry kept with the rest of the archive."}
                  </p>
                  <div className="media-card-actions">
                    <Link
                      href={`/media/${entry.id}`}
                      className="button-link secondary"
                    >
                      Open details
                    </Link>
                    <FavoriteMediaButton
                      mediaId={entry.id}
                      favorite={entry.favorite}
                    />
                    <DeleteMediaButton mediaId={entry.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="action-row">
          <Link href="/upload" className="button-link primary">
            Go to upload
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
