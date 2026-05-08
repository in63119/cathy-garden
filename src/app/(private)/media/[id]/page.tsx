import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteMediaButton } from "@/components/delete-media-button";
import { FavoriteMediaButton } from "@/components/favorite-media-button";
import { MediaAlbumsPanel } from "@/components/media-albums-panel";
import { MediaTagsPanel } from "@/components/media-tags-panel";
import { SectionCard } from "@/components/section-card";
import { ShareMediaPanel } from "@/components/share-media-panel";
import { getMediaEntryById } from "@/lib/media-store";
import {
  getMediaArchiveDate,
  getMediaKindLabel,
  isImageContentType,
  isVideoContentType,
} from "@/lib/media-preview";
import { createPresignedDownload } from "@/lib/s3";
import { formatBytes } from "@/lib/upload-client";

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
  const archiveDateLabel = entry.takenAt ? "Taken" : "Uploaded";

  return (
    <div className="content-shell page-section">
      <SectionCard
        eyebrow="Media Detail"
        title={entry.fileName}
        description="View the full photo or video, then update its favorite, album, tag, and sharing settings."
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
              {entry.favorite ? (
                <span className="media-chip">Favorite</span>
              ) : null}
              {(entry.albums ?? []).map((album) => (
                <span key={album} className="media-chip">
                  {album}
                </span>
              ))}
              {(entry.tags ?? []).map((tag) => (
                <span key={tag} className="media-chip">
                  {tag}
                </span>
              ))}
              <span className="media-chip">
                {archiveDateLabel} {formatUploadedAt(getMediaArchiveDate(entry))}
              </span>
              <span className="media-chip">{formatBytes(entry.size)}</span>
            </div>
            <p className="media-detail-note">
              {mediaKind === "image"
                ? "The full photo stays at the center, with its details and controls close by."
                : "The full video stays at the center, with its details and controls close by."}
            </p>
          </div>

          <div className="media-detail-meta">
            <span>
              File name: <strong>{entry.fileName}</strong>
            </span>
            <span>
              Type: <strong>{mediaKind === "image" ? "Photo" : mediaKind === "video" ? "Video" : "File"}</strong>
            </span>
            <span>
              Size: <strong>{formatBytes(entry.size)}</strong>
            </span>
            <span>
              {archiveDateLabel} at:{" "}
              <strong>{formatUploadedAt(getMediaArchiveDate(entry))}</strong>
            </span>
            <span>
              Uploaded at: <strong>{formatUploadedAt(entry.uploadedAt)}</strong>
            </span>
            {entry.shareToken ? (
              <span>
                Sharing: <strong>Link created</strong>
              </span>
            ) : null}
          </div>
        </div>

        <ShareMediaPanel mediaId={entry.id} shareToken={entry.shareToken} />
        <MediaAlbumsPanel mediaId={entry.id} albums={entry.albums} />
        <MediaTagsPanel mediaId={entry.id} tags={entry.tags} />

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
          <FavoriteMediaButton mediaId={entry.id} favorite={entry.favorite} />
          <DeleteMediaButton mediaId={entry.id} mode="redirect" />
        </div>
      </SectionCard>
    </div>
  );
}
