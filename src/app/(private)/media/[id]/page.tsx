import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteMediaButton } from "@/components/delete-media-button";
import { SectionCard } from "@/components/section-card";
import { getMediaEntryById } from "@/lib/media-store";
import {
  getMediaKindLabel,
  isImageContentType,
  isVideoContentType,
} from "@/lib/media-preview";
import { createPresignedDownload } from "@/lib/s3";

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

  const previewUrl = await createPresignedDownload({
    bucket: entry.bucket,
    objectKey: entry.objectKey,
    contentType: entry.contentType,
  });
  const mediaKind = getMediaKindLabel(entry.contentType);

  return (
    <div className="content-shell page-section">
      <SectionCard
        eyebrow="Media Detail"
        title={entry.fileName}
        description="This detail page now reads real metadata from the archive manifest and renders the original file through a signed S3 read URL."
      >
        <div className="media-detail-stage">
          <div className="media-detail-preview">
            {isImageContentType(entry.contentType) ? (
              <img
                src={previewUrl}
                alt={entry.fileName}
                style={{
                  width: "100%",
                  maxHeight: "76vh",
                  objectFit: "contain",
                  borderRadius: "18px",
                }}
              />
            ) : null}
            {isVideoContentType(entry.contentType) ? (
              <video
                controls
                preload="metadata"
                style={{
                  width: "100%",
                  maxHeight: "76vh",
                  borderRadius: "18px",
                  background: "#000",
                }}
              >
                <source src={previewUrl} type={entry.contentType} />
                Your browser does not support inline video preview.
              </video>
            ) : null}
            {!isImageContentType(entry.contentType) &&
            !isVideoContentType(entry.contentType) ? (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  justifyItems: "center",
                  color: "var(--muted)",
                  lineHeight: 1.7,
                  textAlign: "center",
                }}
              >
                <strong>No inline preview for this file type.</strong>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button-link secondary"
                >
                  Open file
                </a>
              </div>
            ) : null}
          </div>

          <div className="media-detail-summary">
            <div className="media-detail-chips">
              <span className="media-chip">
                {mediaKind === "image" ? "Photo" : mediaKind === "video" ? "Video" : "File"}
              </span>
              <span className="media-chip">{formatUploadedAt(entry.uploadedAt)}</span>
              <span className="media-chip">{entry.size} bytes</span>
            </div>
            <p className="media-detail-note">
              {mediaKind === "image"
                ? "The full image sits at the center first, while archive details stay nearby instead of taking over the page."
                : "The full video remains the focus, with archive details kept as supporting information below."}
            </p>
          </div>

          <div className="media-detail-meta">
            <span>
              File name: <strong>{entry.fileName}</strong>
            </span>
            <span>
              Content type: <code>{entry.contentType}</code>
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
              Preview URL expires in about <code>5 minutes</code>
            </span>
          </div>
        </div>

        <div className="action-row">
          <Link href="/library" className="button-link secondary">
            Back to library
          </Link>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="button-link secondary"
          >
            Open original
          </a>
          <DeleteMediaButton mediaId={entry.id} mode="redirect" />
        </div>
      </SectionCard>
    </div>
  );
}
