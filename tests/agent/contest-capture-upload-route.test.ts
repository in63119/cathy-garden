import fs from "fs";
import path from "path";

describe("contest capture upload route", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("creates an authenticated presigned upload route for contest screenshots", () => {
    const routeSource = fs.readFileSync(
      path.join(rootDir, "src/app/api/contests/capture/route.ts"),
      "utf8",
    );

    expect(routeSource).toContain("isAuthenticated");
    expect(routeSource).toContain("validateContestCaptureUploadRequest");
    expect(routeSource).toContain("createPresignedContestCaptureUpload");
    expect(routeSource).toContain("contest-capture-presign-failed");
  });

  test("creates an authenticated presigned display route for contest screenshots", () => {
    const routeSource = fs.readFileSync(
      path.join(rootDir, "src/app/api/contests/[id]/capture/route.ts"),
      "utf8",
    );

    expect(routeSource).toContain("isAuthenticated");
    expect(routeSource).toContain("readContestEntries");
    expect(routeSource).toContain("createPresignedDownload");
    expect(routeSource).toContain("captureImageObjectKey");
    expect(routeSource).toContain("captureImageObjectKeys");
    expect(routeSource).toContain("Promise.all");
    expect(routeSource).toContain("images");
    expect(routeSource).toContain("imageUrl");
  });
});
