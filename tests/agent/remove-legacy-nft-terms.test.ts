import fs from "fs";
import path from "path";

describe("legacy NFT terminology cleanup", () => {
  test("removes NFT tab artifacts from runtime source files", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const runtimeFiles = [
      "src/legacy-pages/Garden.tsx",
      "src/App.tsx",
      "src/common/constants/page-urls.ts",
    ];
    const forbiddenTerms = ["NFT", "Mint", "Market", "TabSelector", "tabSelect"];

    for (const relativePath of runtimeFiles) {
      const content = fs.readFileSync(path.join(rootDir, relativePath), "utf8");

      for (const term of forbiddenTerms) {
        expect(content.includes(term)).toBe(false);
      }
    }
  });

  test("removes the legacy tab selector files", () => {
    const rootDir = path.resolve(__dirname, "../..");

    expect(
      fs.existsSync(path.join(rootDir, "src/components/TabSelector.tsx"))
    ).toBe(false);
    expect(
      fs.existsSync(path.join(rootDir, "src/common/recoil/tabSelect.ts"))
    ).toBe(false);
  });
});
