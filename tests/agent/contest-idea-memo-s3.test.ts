import fs from "fs";
import path from "path";

describe("contest idea memo S3 storage", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("stores contest idea memos as JSON under the contests prefix", () => {
    const storeSource = fs.readFileSync(
      path.join(rootDir, "lib/contest-ideas.ts"),
      "utf8",
    );

    expect(storeSource).toContain("buildContestIdeaMemoObjectKey");
    expect(storeSource).toContain("contests/${normalizedContestId}/idea-memo.json");
    expect(storeSource).toContain("PutObjectCommand");
    expect(storeSource).toContain('ContentType: "application/json"');
    expect(storeSource).toContain("NoSuchKey");
  });

  test("exposes authenticated GET and PUT routes for contest memos", () => {
    const routeSource = fs.readFileSync(
      path.join(rootDir, "src/app/api/contests/[id]/idea-memo/route.ts"),
      "utf8",
    );

    expect(routeSource).toContain("isAuthenticated");
    expect(routeSource).toContain("readContestIdeaMemo");
    expect(routeSource).toContain("writeContestIdeaMemo");
    expect(routeSource).toContain("export async function GET");
    expect(routeSource).toContain("export async function PUT");
    expect(routeSource).toContain("invalid-contest-id");
  });
});
