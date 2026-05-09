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
});
