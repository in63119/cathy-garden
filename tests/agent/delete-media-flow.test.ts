import fs from "fs";
import path from "path";

describe("delete media flow scaffolding", () => {
  test("keeps the delete route and UI entry points in place", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const requiredFiles = [
      "src/app/api/media/[id]/route.ts",
      "components/delete-media-button.tsx",
      "components/favorite-media-button.tsx",
      "components/media-albums-panel.tsx",
      "components/media-tags-panel.tsx",
      "components/share-media-panel.tsx",
      "src/app/(private)/media/[id]/page.tsx",
      "src/app/share/[token]/page.tsx",
    ];

    for (const relativePath of requiredFiles) {
      expect(fs.existsSync(path.join(rootDir, relativePath))).toBe(true);
    }
  });

  test("wires delete interactions into the library and detail pages", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const libraryPage = fs.readFileSync(
      path.join(rootDir, "src/app/(private)/library/page.tsx"),
      "utf8"
    );
    const mediaDetailPage = fs.readFileSync(
      path.join(rootDir, "src/app/(private)/media/[id]/page.tsx"),
      "utf8"
    );
    const uploadPanel = fs.readFileSync(
      path.join(rootDir, "components/upload-request-panel.tsx"),
      "utf8"
    );

    expect(libraryPage).toContain("DeleteMediaButton");
    expect(libraryPage).toContain("FavoriteMediaButton");
    expect(libraryPage).toContain("즐겨찾기");
    expect(libraryPage).toContain("normalizeMediaAlbumFilter");
    expect(libraryPage).toContain("앨범 필터");
    expect(libraryPage).toContain("createPresignedDownload");
    expect(libraryPage).toContain("thumbnailObjectKey");
    expect(libraryPage).toContain("<img");
    expect(libraryPage).toContain("media-card");
    expect(libraryPage).toContain("보관함에 저장된 영상입니다.");
    expect(libraryPage).toContain("normalizeMediaFilterValue");
    expect(libraryPage).toContain("normalizeMediaSearchQuery");
    expect(libraryPage).toContain("normalizeMediaTagFilter");
    expect(libraryPage).toContain("normalizeMediaSortValue");
    expect(libraryPage).toContain("buildLibraryHref");
    expect(libraryPage).toContain("보관함 검색");
    expect(libraryPage).toContain("파일 이름으로 검색");
    expect(libraryPage).toContain("최신순");
    expect(libraryPage).toContain("사진");
    expect(libraryPage).toContain("업로드 완료");
    expect(mediaDetailPage).toContain('mode="redirect"');
    expect(mediaDetailPage).toContain("FavoriteMediaButton");
    expect(mediaDetailPage).toContain("MediaAlbumsPanel");
    expect(mediaDetailPage).toContain("MediaTagsPanel");
    expect(mediaDetailPage).toContain("ShareMediaPanel");
    expect(mediaDetailPage).toContain("createPresignedDownload");
    expect(mediaDetailPage).toContain("<video");
    expect(mediaDetailPage).toContain("<img");
    expect(mediaDetailPage).toContain("media-detail-summary");
    expect(mediaDetailPage).toContain("사진이나 영상을 크게 보고");
    expect(mediaDetailPage).not.toContain("S3 key:");
    expect(mediaDetailPage).not.toContain("Bucket:");
    expect(mediaDetailPage).not.toContain("Preview URL expires");
    expect(uploadPanel).toContain("지금 보관함 열기");
    expect(uploadPanel).toContain("업로드가 완료되었습니다. 보관함을 여는 중입니다...");
    expect(uploadPanel).toContain("여러 파일을 한 번에 선택할 수 있습니다.");
    expect(uploadPanel).toContain("duplicate-upload");
  });
});
