import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteMediaButton } from "@/components/delete-media-button";
import { SectionCard } from "@/components/section-card";
import { getMediaEntryById } from "@/lib/media-store";

type MediaDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatUploadedAt(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MediaDetailPage({
  params,
}: MediaDetailPageProps) {
  const { id } = await params;
  const entry = await getMediaEntryById(id);

  if (!entry) {
    notFound();
  }

  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Media Detail"
        title={entry.fileName}
        description="This detail page now reads real metadata from the archive manifest. The next step can add image/video previews using signed read URLs."
      >
        <div
          style={{
            minHeight: "220px",
            borderRadius: "24px",
            border: "1px dashed var(--border)",
            background: "rgba(255,255,255,0.45)",
            display: "grid",
            gap: "8px",
            padding: "24px",
            color: "var(--muted)",
            lineHeight: 1.7,
          }}
        >
          <span>
            File name: <strong>{entry.fileName}</strong>
          </span>
          <span>
            Content type: <code>{entry.contentType}</code>
          </span>
          <span>
            Uploaded at: <code>{formatUploadedAt(entry.uploadedAt)}</code>
          </span>
          <span>
            S3 key: <code>{entry.objectKey}</code>
          </span>
          <span>
            Bucket: <code>{entry.bucket}</code>
          </span>
          <span>
            Region: <code>{entry.region}</code>
          </span>
          <span>
            Size: <code>{entry.size}</code> bytes
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/library" className="button-link secondary">
            Back to library
          </Link>
          <DeleteMediaButton mediaId={entry.id} mode="redirect" />
        </div>
      </SectionCard>
    </div>
  );
}
