import fs from "fs";
import path from "path";

describe("navigation labels", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("uses Photos and Contests as the private navigation entries", () => {
    const headerSource = fs.readFileSync(
      path.join(rootDir, "components/site-header.tsx"),
      "utf8",
    );

    expect(headerSource).toContain('{ href: "/library", label: "사진" }');
    expect(headerSource).toContain('{ href: "/contests", label: "공모전" }');
    expect(headerSource).not.toContain('label: "보관함"');
    expect(headerSource).not.toContain('label: "올리기"');
  });

  test("keeps uploading inside the Photos page", () => {
    const librarySource = fs.readFileSync(
      path.join(rootDir, "src/app/(private)/library/page.tsx"),
      "utf8",
    );

    expect(librarySource).toContain("UploadRequestPanel");
    expect(librarySource).toContain('eyebrow="사진"');
    expect(librarySource).toContain('title="사진"');
    expect(librarySource).not.toContain('href="/upload"');
  });
});
