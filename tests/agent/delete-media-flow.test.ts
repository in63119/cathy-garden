import fs from "fs";
import path from "path";

describe("delete media flow scaffolding", () => {
  test("keeps the delete route and UI entry points in place", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const requiredFiles = [
      "src/app/api/media/[id]/route.ts",
      "components/delete-media-button.tsx",
      "components/favorite-media-button.tsx",
      "src/app/(private)/media/[id]/page.tsx",
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
    expect(libraryPage).toContain("Favorites");
    expect(libraryPage).toContain("createPresignedDownload");
    expect(libraryPage).toContain("<img");
    expect(libraryPage).toContain("media-card");
    expect(libraryPage).toContain("Video keeps its full quiet moment.");
    expect(libraryPage).toContain("normalizeMediaFilterValue");
    expect(libraryPage).toContain("normalizeMediaSortValue");
    expect(libraryPage).toContain("buildLibraryHref");
    expect(libraryPage).toContain("Newest first");
    expect(libraryPage).toContain("Photos");
    expect(libraryPage).toContain("Upload complete");
    expect(mediaDetailPage).toContain('mode="redirect"');
    expect(mediaDetailPage).toContain("FavoriteMediaButton");
    expect(mediaDetailPage).toContain("createPresignedDownload");
    expect(mediaDetailPage).toContain("<video");
    expect(mediaDetailPage).toContain("<img");
    expect(mediaDetailPage).toContain("media-detail-summary");
    expect(uploadPanel).toContain("Open library now");
    expect(uploadPanel).toContain("completed successfully. Opening the library...");
    expect(uploadPanel).toContain("multiple files, sequential uploads");
  });
});
