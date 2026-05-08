import { notFound } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import { getMediaEntryByShareToken } from "@/lib/media-store";
import {
  isImageContentType,
  isVideoContentType,
} from "@/lib/media-preview";
import { createPresignedDownload } from "@/lib/s3";

type SharedMediaPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharedMediaPage({
  params,
}: SharedMediaPageProps) {
  const { token } = await params;
  const entry = await getMediaEntryByShareToken(token);

  if (!entry) {
    notFound();
  }

  const previewUrl = await createPresignedDownload({
    bucket: entry.bucket,
    objectKey: entry.objectKey,
    contentType: entry.contentType,
  });

  return (
    <div className="content-shell page-section">
      <SectionCard
        eyebrow="Shared Media"
        title={entry.fileName}
        description="This private archive item is available through a share link."
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
          </div>
        </div>

        <div className="action-row">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="button-link secondary"
          >
            Open original
          </a>
        </div>
      </SectionCard>
    </div>
  );
}
