import fs from "fs";
import path from "path";

describe("contest submission archive S3 storage", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("stores submission archives as JSON under the contests prefix", () => {
    const storeSource = fs.readFileSync(
      path.join(rootDir, "lib/contest-submissions.ts"),
      "utf8",
    );

    expect(storeSource).toContain("buildContestSubmissionsObjectKey");
    expect(storeSource).toContain("contests/${normalizedContestId}/submissions.json");
    expect(storeSource).toContain('type: "file" | "youtube"');
    expect(storeSource).toContain("url: string");
    expect(storeSource).toContain('entry.type === "youtube" ? "youtube" : "file"');
    expect(storeSource).toContain("PutObjectCommand");
    expect(storeSource).toContain('ContentType: "application/json"');
    expect(storeSource).toContain("NoSuchKey");
  });

  test("exposes authenticated GET and POST routes for submission archives", () => {
    const routeSource = fs.readFileSync(
      path.join(rootDir, "src/app/api/contests/[id]/submissions/route.ts"),
      "utf8",
    );

    expect(routeSource).toContain("isAuthenticated");
    expect(routeSource).toContain("readContestSubmissionArchive");
    expect(routeSource).toContain("addContestSubmission");
    expect(routeSource).toContain('payload?.type === "youtube" ? "youtube" : "file"');
    expect(routeSource).toContain("url.slice(0, 1024)");
    expect(routeSource).toContain("export async function GET");
    expect(routeSource).toContain("export async function POST");
    expect(routeSource).toContain("invalid-submission");
  });
});
