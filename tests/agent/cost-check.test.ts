import fs from "fs";
import path from "path";

import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  buildUploadObjectKey,
} from "../../lib/upload-policy";

describe("cost control checks", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("documents the deployment cost checklist", () => {
    expect(
      fs.existsSync(path.join(rootDir, "docs/phase-10-cost-check.md"))
    ).toBe(true);
  });

  test("keeps direct upload cost guards in the upload policy", () => {
    expect(MAX_UPLOAD_SIZE_BYTES).toBeLessThanOrEqual(250 * 1024 * 1024);
    expect(ALLOWED_UPLOAD_MIME_TYPES).toEqual(
      expect.arrayContaining(["image/jpeg", "video/mp4"])
    );
    expect(buildUploadObjectKey("garden.jpg")).toMatch(/^uploads\//);
  });

  test("keeps Vercel out of the original file transfer path", () => {
    const s3Source = fs.readFileSync(path.join(rootDir, "lib/s3.ts"), "utf8");
    const uploadClientSource = fs.readFileSync(
      path.join(rootDir, "lib/upload-client.ts"),
      "utf8"
    );

    expect(s3Source).toContain("PutObjectCommand");
    expect(s3Source).toContain("getSignedUrl");
    expect(uploadClientSource).toContain('request.open("PUT", params.uploadUrl)');
    expect(uploadClientSource).not.toContain("/api/upload/file");
  });
});
