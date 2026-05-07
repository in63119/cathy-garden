import { DeleteMediaButton } from "@/components/delete-media-button";
import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { readMediaEntries } from "@/lib/media-store";
import {
  filterAndSortMediaEntries,
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
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const filter = normalizeMediaFilterValue(params?.filter);
  const sort = normalizeMediaSortValue(params?.sort);
  const uploaded = params?.uploaded?.trim() ?? "";
  const entries = await readMediaEntries();
  const visibleEntries = filterAndSortMediaEntries(entries, { filter, sort });
  const entriesWithPreview = await Promise.all(
    visibleEntries.map(async (entry) => {
      const mediaKind = getMediaKindLabel(entry.contentType);

      return {
        ...entry,
        mediaKind,
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
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Library"
        title="The media library now reflects uploaded archive entries."
        description="This page reads saved upload metadata, supports basic filtering, and keeps the preview load light for video items."
      >
        {uploaded ? (
          <div className="card-soft panel-success" style={{ display: "grid", gap: "6px", padding: "16px", lineHeight: 1.6 }}>
            <strong>Upload complete</strong>
            <span>
              <code>{uploaded}</code> is now part of the archive.
            </span>
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(["all", "image", "video"] as const).map((option) => (
              <Link
                key={option}
                href={buildLibraryHref({ filter: option, sort })}
                className={`button-link secondary${filter === option ? " is-active" : ""}`}
              >
                {option === "all"
                  ? "All"
                  : option === "image"
                    ? "Photos"
                    : "Videos"}
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            {entriesWithPreview.map((entry) => (
              <article
                key={entry.id}
                className="card-soft"
                style={{
                  minHeight: "180px",
                  padding: "14px",
                  display: "grid",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    minHeight: "180px",
                    borderRadius: "18px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "rgba(247, 244, 236, 0.9)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {isImageContentType(entry.contentType) ? (
                    <img
                      src={entry.previewUrl ?? ""}
                      alt={entry.fileName}
                      style={{
                        width: "100%",
                        height: "180px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : null}
                  {isVideoContentType(entry.contentType) ? (
                    <Link
                      href={`/media/${entry.id}`}
                      style={{
                        width: "100%",
                        height: "180px",
                        display: "grid",
                        gridTemplateRows: "1fr auto",
                        background:
                          "linear-gradient(180deg, rgba(28, 35, 32, 0.92), rgba(74, 95, 82, 0.84))",
                        color: "#f7f4ec",
                        padding: "16px",
                        textDecoration: "none",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.16)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "1.5rem",
                          }}
                        >
                          ▶
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gap: "4px",
                          alignSelf: "end",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "0.92rem",
                            lineHeight: 1.4,
                          }}
                        >
                          Video preview on detail page
                        </strong>
                        <span
                          style={{
                            fontSize: "0.82rem",
                            opacity: 0.82,
                            lineHeight: 1.5,
                          }}
                        >
                          Open this item to stream the signed original file.
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
                <strong style={{ fontSize: "1rem", lineHeight: 1.5 }}>
                  {entry.fileName}
                </strong>
                <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                  Kind: {entry.mediaKind}
                </span>
                <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                  {entry.contentType}
                </span>
                <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                  Uploaded {formatUploadedAt(entry.uploadedAt)}
                </span>
                <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                  S3 key: <code>{entry.objectKey}</code>
                </span>
                <Link
                  href={`/media/${entry.id}`}
                  className="button-link secondary"
                  style={{ width: "fit-content", marginTop: "8px" }}
                >
                  Open details
                </Link>
                <DeleteMediaButton mediaId={entry.id} />
              </article>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/upload" className="button-link primary">
            Go to upload
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
