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
  normalizeMediaAlbumFilter,
  normalizeMediaFilterValue,
  normalizeMediaSearchQuery,
  normalizeMediaTagFilter,
  normalizeMediaSortValue,
} from "@/lib/media-preview";
import { createPresignedDownload } from "@/lib/s3";

function formatUploadedAt(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildLibraryHref(params: {
  filter: string;
  sort: string;
  album: string;
  query: string;
  tag: string;
}) {
  const searchParams = new URLSearchParams({
    filter: params.filter,
    sort: params.sort,
  });

  if (params.query) {
    searchParams.set("q", params.query);
  }

  if (params.album) {
    searchParams.set("album", params.album);
  }

  if (params.tag) {
    searchParams.set("tag", params.tag);
  }

  return `/library?${searchParams.toString()}`;
}

type LibraryPageProps = {
  searchParams?: Promise<{
    filter?: string;
    sort?: string;
    album?: string;
    q?: string;
    tag?: string;
    uploaded?: string;
    uploadedCount?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const filter = normalizeMediaFilterValue(params?.filter);
  const sort = normalizeMediaSortValue(params?.sort);
  const album = normalizeMediaAlbumFilter(params?.album);
  const query = normalizeMediaSearchQuery(params?.q);
  const tag = normalizeMediaTagFilter(params?.tag);
  const uploaded = params?.uploaded?.trim() ?? "";
  const uploadedCount = Number(params?.uploadedCount ?? "0");
  const entries = await readMediaEntries();
  const visibleEntries = filterAndSortMediaEntries(entries, {
    filter,
    sort,
    album,
    query,
    tag,
  });
  const entriesWithPreview = await Promise.all(
    visibleEntries.map(async (entry) => {
      const mediaKind = getMediaKindLabel(entry.contentType);
      const archiveDateLabel = entry.takenAt ? "촬영" : "업로드";

      return {
        ...entry,
        mediaKind,
        archiveDateLabel,
        previewUrl:
          mediaKind === "image"
            ? await createPresignedDownload({
                bucket: entry.bucket,
                objectKey: entry.thumbnailObjectKey ?? entry.objectKey,
                contentType: entry.thumbnailObjectKey ? "image/jpeg" : entry.contentType,
              })
            : null,
      };
    })
  );

  return (
    <div className="content-shell page-section">
      <SectionCard
        eyebrow="보관함"
        title="보관함 둘러보기"
        description="사진과 영상을 종류, 날짜, 즐겨찾기, 앨범, 태그, 파일 이름으로 찾아볼 수 있습니다."
      >
        {uploaded ? (
          <div className="card-soft panel-success" style={{ display: "grid", gap: "6px", padding: "16px", lineHeight: 1.6 }}>
            <strong>업로드 완료</strong>
            {uploadedCount > 1 ? (
              <span>
                <code>{uploadedCount}</code>개 파일이 보관함에 추가되었습니다.
                마지막으로 추가된 파일은 <code>{uploaded}</code>입니다.
              </span>
            ) : (
              <span>
                <code>{uploaded}</code> 파일이 보관함에 추가되었습니다.
              </span>
            )}
          </div>
        ) : null}

        <form
          action="/library"
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          <input type="hidden" name="filter" value={filter} />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="album" value={album} />
          <input type="hidden" name="tag" value={tag} />
          <label htmlFor="library-search" style={{ fontWeight: 700 }}>
            보관함 검색
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <input
              id="library-search"
              name="q"
              type="search"
              className="input-field"
              defaultValue={query}
              placeholder="파일 이름으로 검색"
              style={{ maxWidth: "420px" }}
            />
            <button type="submit" className="button-link primary">
              검색
            </button>
            {query ? (
              <Link
                href={buildLibraryHref({ filter, sort, album, query: "", tag })}
                className="button-link secondary"
              >
                지우기
              </Link>
            ) : null}
          </div>
        </form>

        <div className="filter-toolbar">
          <div className="filter-cluster">
            {(["all", "favorite", "image", "video"] as const).map((option) => (
              <Link
                key={option}
                href={buildLibraryHref({ filter: option, sort, album, query, tag })}
                className={`button-link secondary${filter === option ? " is-active" : ""}`}
              >
                {option === "all"
                  ? "전체"
                  : option === "favorite"
                    ? "즐겨찾기"
                    : option === "image"
                      ? "사진"
                      : "영상"}
              </Link>
            ))}
          </div>

          <div className="filter-cluster">
            {(["newest", "oldest"] as const).map((option) => (
              <Link
                key={option}
                href={buildLibraryHref({ filter, sort: option, album, query, tag })}
                className={`button-link secondary${sort === option ? " is-active" : ""}`}
              >
                {option === "newest" ? "최신순" : "오래된순"}
              </Link>
            ))}
          </div>
        </div>

        {album ? (
          <div className="card-soft" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", padding: "14px" }}>
            <span>
              앨범 필터: <strong>{album}</strong>
            </span>
            <Link
              href={buildLibraryHref({ filter, sort, album: "", query, tag })}
              className="button-link secondary"
            >
              앨범 필터 지우기
            </Link>
          </div>
        ) : null}

        {tag ? (
          <div className="card-soft" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", padding: "14px" }}>
            <span>
              태그 필터: <strong>{tag}</strong>
            </span>
            <Link
              href={buildLibraryHref({ filter, sort, album, query, tag: "" })}
              className="button-link secondary"
            >
              태그 필터 지우기
            </Link>
          </div>
        ) : null}

        {entries.length === 0 ? (
          <div className="panel panel-dashed panel-muted">
            아직 보관된 항목이 없습니다. 첫 사진이나 영상을 올려 보관함을 시작하세요.
          </div>
        ) : entriesWithPreview.length === 0 ? (
          <div className="panel panel-dashed panel-muted">
            현재 필터나 검색어와 일치하는 항목이 없습니다.
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
                          보관함에 저장된 영상입니다.
                        </strong>
                        <span style={{ fontSize: "0.84rem", opacity: 0.86, lineHeight: 1.5 }}>
                          자세히 보기에서 재생할 수 있습니다.
                        </span>
                      </div>
                    </Link>
                  ) : null}
                  {!isImageContentType(entry.contentType) &&
                  !isVideoContentType(entry.contentType) ? (
                    <span style={{ color: "var(--muted)", fontWeight: 700 }}>
                      미리보기를 사용할 수 없습니다
                    </span>
                  ) : null}
                </div>
                <div className="media-card-body">
                  <div className="media-card-meta">
                    <span className="media-chip">
                      {entry.mediaKind === "image" ? "사진" : "영상"}
                    </span>
                    {entry.favorite ? (
                      <span className="media-chip">즐겨찾기</span>
                    ) : null}
                    {(entry.albums ?? []).map((entryAlbum) => (
                      <Link
                        key={entryAlbum}
                        href={buildLibraryHref({
                          filter,
                          sort,
                          album: entryAlbum,
                          query,
                          tag,
                        })}
                        className="media-chip"
                      >
                        {entryAlbum}
                      </Link>
                    ))}
                    {(entry.tags ?? []).map((entryTag) => (
                      <Link
                        key={entryTag}
                        href={buildLibraryHref({
                          filter,
                          sort,
                          album,
                          query,
                          tag: entryTag,
                        })}
                        className="media-chip"
                      >
                        {entryTag}
                      </Link>
                    ))}
                    <span className="media-chip">
                      {entry.archiveDateLabel}{" "}
                      {formatUploadedAt(getMediaArchiveDate(entry))}
                    </span>
                  </div>
                  <h2 className="media-card-title">{entry.fileName}</h2>
                  <p className="media-card-caption">
                    {entry.mediaKind === "image"
                      ? "개인 보관함에 간직한 사진입니다."
                      : "개인 보관함에 간직한 영상입니다."}
                  </p>
                  <div className="media-card-actions">
                    <Link
                      href={`/media/${entry.id}`}
                      className="button-link secondary"
                    >
                      자세히 보기
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
            사진 올리기
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
