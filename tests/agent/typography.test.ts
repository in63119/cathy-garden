import fs from "fs";
import path from "path";

describe("app typography", () => {
  test("loads the self-hosted modern sans font and applies it globally", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const layoutSource = fs.readFileSync(
      path.join(rootDir, "src/app/layout.tsx"),
      "utf8"
    );
    const globalStyles = fs.readFileSync(
      path.join(rootDir, "src/app/globals.css"),
      "utf8"
    );
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
    );

    expect(packageJson.dependencies["@fontsource/pretendard"]).toBeDefined();
    expect(packageJson.dependencies["@fontsource/gowun-batang"]).toBeUndefined();
    expect(layoutSource).toContain('@fontsource/pretendard/400.css');
    expect(layoutSource).not.toContain("@fontsource/gowun-batang");
    expect(globalStyles).toContain('--font-sans: "Pretendard"');
    expect(globalStyles).toContain('--font-display: "Pretendard"');
    expect(globalStyles).toContain("font-family: var(--font-sans)");
    expect(globalStyles).toContain("font-family: var(--font-display)");
  });
});
