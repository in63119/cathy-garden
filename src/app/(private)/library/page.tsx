import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { readMediaEntries } from "@/lib/media-store";

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
            {entries.map((entry) => (
              <article
                key={entry.id}
                style={{
                  minHeight: "180px",
                  borderRadius: "22px",
                  border: "1px solid var(--border)",
                  padding: "18px",
                  background: "rgba(255,255,255,0.58)",
                  display: "grid",
                  gap: "8px",
                }}
              >
                <strong style={{ fontSize: "1rem", lineHeight: 1.5 }}>
                  {entry.fileName}
                </strong>
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
