import fs from "fs";
import path from "path";

describe("contest CRUD S3 storage", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("stores the contest list as a JSON index under contests/", () => {
    const storeSource = fs.readFileSync(
      path.join(rootDir, "lib/contests.ts"),
      "utf8",
    );

    expect(storeSource).toContain('CONTEST_INDEX_OBJECT_KEY = "contests/index.json"');
    expect(storeSource).toContain("readContestEntries");
    expect(storeSource).toContain("createContestEntry");
    expect(storeSource).toContain("updateContestEntry");
    expect(storeSource).toContain("deleteContestEntry");
    expect(storeSource).toContain("ContestPrizeItem");
    expect(storeSource).toContain("prizeItems: ContestPrizeItem[]");
    expect(storeSource).toContain("normalizeContestPrizeItems");
    expect(storeSource).toContain("buildContestPrizeSummary");
    expect(storeSource).toContain("captureImageObjectKeys: string[]");
    expect(storeSource).toContain("captureImageObjectKeys?: string[]");
    expect(storeSource).toContain("captureImageObjectKeys.length === 0");
    expect(storeSource).toContain('ContentType: "application/json"');
    expect(storeSource).toContain("NoSuchKey");
  });

  test("exposes authenticated collection and item routes", () => {
    const collectionRoute = fs.readFileSync(
      path.join(rootDir, "src/app/api/contests/route.ts"),
      "utf8",
    );
    const itemRoute = fs.readFileSync(
      path.join(rootDir, "src/app/api/contests/[id]/route.ts"),
      "utf8",
    );

    expect(collectionRoute).toContain("isAuthenticated");
    expect(collectionRoute).toContain("readContestEntries");
    expect(collectionRoute).toContain("createContestEntry");
    expect(collectionRoute).toContain("prizeItems");
    expect(collectionRoute).toContain("captureImageObjectKeys");
    expect(collectionRoute).toContain("export async function GET");
    expect(collectionRoute).toContain("export async function POST");
    expect(itemRoute).toContain("updateContestEntry");
    expect(itemRoute).toContain("deleteContestEntry");
    expect(itemRoute).toContain("prizeItems");
    expect(itemRoute).toContain("captureImageObjectKeys");
    expect(itemRoute).toContain("export async function PUT");
    expect(itemRoute).toContain("export async function DELETE");
  });
});
