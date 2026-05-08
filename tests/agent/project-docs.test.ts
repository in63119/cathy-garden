import fs from "fs";
import path from "path";

describe("project planning docs", () => {
  test("keeps the core migration phase documents in docs/", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const requiredDocs = [
      "docs/architecture.md",
      "docs/tasks.md",
      "docs/phase-1-product-definition.md",
      "docs/phase-2-technical-transition.md",
      "docs/phase-3-test-strategy.md",
      "docs/phase-4-app-foundation.md",
      "docs/phase-10-storage-integration-check.md",
      "docs/phase-10-security-check.md",
    ];

    for (const relativePath of requiredDocs) {
      expect(fs.existsSync(path.join(rootDir, relativePath))).toBe(true);
    }
  });
});
