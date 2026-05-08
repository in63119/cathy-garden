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
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
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
  const archiveDateLabel = entry.takenAt ? "촬영" : "업로드";

  return (
    <div className="content-shell page-section">
      <SectionCard
        eyebrow="자세히 보기"
        title={entry.fileName}
        description="사진이나 영상을 크게 보고, 즐겨찾기와 앨범, 태그, 공유 설정을 관리할 수 있습니다."
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
                <strong>이 파일 형식은 미리보기를 지원하지 않습니다.</strong>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button-link secondary"
                >
                  파일 열기
                </a>
              </div>
            ) : null}
          </div>

          <div className="media-detail-summary">
            <div className="media-detail-chips">
              <span className="media-chip">
                {mediaKind === "image" ? "사진" : mediaKind === "video" ? "영상" : "파일"}
              </span>
              {entry.favorite ? (
                <span className="media-chip">즐겨찾기</span>
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
                ? "사진을 크게 보면서 필요한 설정을 바로 관리할 수 있습니다."
                : "영상을 크게 보면서 필요한 설정을 바로 관리할 수 있습니다."}
            </p>
          </div>

          <div className="media-detail-meta">
            <span>
              파일 이름: <strong>{entry.fileName}</strong>
            </span>
            <span>
              종류: <strong>{mediaKind === "image" ? "사진" : mediaKind === "video" ? "영상" : "파일"}</strong>
            </span>
            <span>
              크기: <strong>{formatBytes(entry.size)}</strong>
            </span>
            <span>
              {archiveDateLabel}일:{" "}
              <strong>{formatUploadedAt(getMediaArchiveDate(entry))}</strong>
            </span>
            <span>
              업로드일: <strong>{formatUploadedAt(entry.uploadedAt)}</strong>
            </span>
            {entry.shareToken ? (
              <span>
                공유: <strong>링크 생성됨</strong>
              </span>
            ) : null}
          </div>
        </div>

        <ShareMediaPanel mediaId={entry.id} shareToken={entry.shareToken} />
        <MediaAlbumsPanel mediaId={entry.id} albums={entry.albums} />
        <MediaTagsPanel mediaId={entry.id} tags={entry.tags} />

        <div className="action-row">
          <Link href="/library" className="button-link secondary">
            보관함으로 돌아가기
          </Link>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="button-link secondary"
          >
            원본 열기
          </a>
          <FavoriteMediaButton mediaId={entry.id} favorite={entry.favorite} />
          <DeleteMediaButton mediaId={entry.id} mode="redirect" />
        </div>
      </SectionCard>
    </div>
  );
}
