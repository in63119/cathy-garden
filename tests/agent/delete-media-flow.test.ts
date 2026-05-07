import fs from "fs";
import path from "path";

describe("delete media flow scaffolding", () => {
  test("keeps the delete route and UI entry points in place", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const requiredFiles = [
      "src/app/api/media/[id]/route.ts",
      "components/delete-media-button.tsx",
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

    expect(libraryPage).toContain("DeleteMediaButton");
    expect(mediaDetailPage).toContain('mode="redirect"');
  });
});
