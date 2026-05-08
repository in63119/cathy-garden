import fs from "fs";
import path from "path";

describe("upload presign route", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("checks for duplicate media before issuing a presigned URL", () => {
    const source = fs.readFileSync(
      path.join(rootDir, "src/app/api/upload/presign/route.ts"),
      "utf8"
    );

    expect(source).toContain("findDuplicateMediaEntry");
    expect(source).toContain('error: "duplicate-upload"');
    expect(source).toContain("status: 409");
    expect(source.indexOf("findDuplicateMediaEntry")).toBeLessThan(
      source.indexOf("createPresignedUpload")
    );
  });
});
