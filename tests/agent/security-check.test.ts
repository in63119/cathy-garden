import fs from "fs";
import path from "path";

describe("security checks", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("documents the deployment security checklist", () => {
    expect(
      fs.existsSync(path.join(rootDir, "docs/phase-10-security-check.md"))
    ).toBe(true);
  });

  test("does not keep raw console logging in runtime utility code", () => {
    const files = [
      "src/common/utils/axios.ts",
      "src/common/utils/kakao.ts",
    ];

    for (const relativePath of files) {
      const source = fs.readFileSync(path.join(rootDir, relativePath), "utf8");

      expect(source).not.toMatch(/console\.(log|error|warn|info)\(/);
    }
  });

  test("does not log raw presign errors", () => {
    const source = fs.readFileSync(
      path.join(rootDir, "src/app/api/upload/presign/route.ts"),
      "utf8"
    );

    expect(source).toContain("errorName");
    expect(source).not.toContain(
      'console.error("Failed to create S3 presigned upload URL", error)'
    );
  });

  test("does not log browser upload failures with presigned URLs", () => {
    const source = fs.readFileSync(
      path.join(rootDir, "lib/upload-client.ts"),
      "utf8"
    );

    expect(source).toContain("s3-upload-failed");
    expect(source).not.toMatch(/console\.(log|error|warn|info)\(/);
  });
});
