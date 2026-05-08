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
  const downloadUrl = await createPresignedDownload({
    bucket: entry.bucket,
    objectKey: entry.objectKey,
    contentType: entry.contentType,
    downloadFileName: entry.fileName,
  });

  return (
    <div className="content-shell page-section">
      <SectionCard
        eyebrow="공유 항목"
        title={entry.fileName}
        description="공유 링크로 볼 수 있는 보관함 항목입니다."
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
                이 브라우저에서는 영상 미리보기를 지원하지 않습니다.
              </video>
            ) : null}
          </div>
        </div>

        <div className="action-row">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="button-link secondary"
            download={entry.fileName}
          >
            다운로드
          </a>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="button-link secondary"
          >
            원본 열기
          </a>
        </div>
      </SectionCard>
    </div>
  );
}
