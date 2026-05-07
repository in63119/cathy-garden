import { DeleteMediaButton } from "@/components/delete-media-button";
import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { readMediaEntries } from "@/lib/media-store";
import {
  getMediaKindLabel,
  isImageContentType,
  isVideoContentType,
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

export default async function LibraryPage() {
  const entries = await readMediaEntries();
  const entriesWithPreview = await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      mediaKind: getMediaKindLabel(entry.contentType),
      previewUrl: await createPresignedDownload({
        bucket: entry.bucket,
        objectKey: entry.objectKey,
        contentType: entry.contentType,
      }),
    }))
  );

  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Library"
        title="The media library now reflects uploaded archive entries."
        description="This page is already reading saved upload metadata. The next layer will add thumbnails, previews, and richer browsing."
      >
        {entries.length === 0 ? (
          <div
            style={{
              minHeight: "220px",
              borderRadius: "22px",
              border: "1px dashed var(--border)",
              padding: "24px",
              background: "rgba(255,255,255,0.42)",
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            No uploaded items yet. Use the upload route to add the first photo
            or video to the archive.
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
                style={{
                  minHeight: "180px",
                  borderRadius: "22px",
                  border: "1px solid var(--border)",
                  padding: "14px",
                  background: "rgba(255,255,255,0.58)",
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
                      src={entry.previewUrl}
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
                    <video
                      muted
                      controls
                      preload="metadata"
                      style={{
                        width: "100%",
                        height: "180px",
                        objectFit: "cover",
                        background: "#000",
                        display: "block",
                      }}
                    >
                      <source src={entry.previewUrl} type={entry.contentType} />
                    </video>
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
