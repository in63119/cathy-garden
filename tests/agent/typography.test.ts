import fs from "fs";
import path from "path";

describe("app typography", () => {
  test("loads the self-hosted archive fonts and applies them globally", () => {
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
    expect(packageJson.dependencies["@fontsource/gowun-batang"]).toBeDefined();
    expect(layoutSource).toContain('@fontsource/pretendard/400.css');
    expect(layoutSource).toContain('@fontsource/gowun-batang/400.css');
    expect(globalStyles).toContain('--font-sans: "Pretendard"');
    expect(globalStyles).toContain('--font-display: "Gowun Batang"');
    expect(globalStyles).toContain("font-family: var(--font-sans)");
    expect(globalStyles).toContain("font-family: var(--font-display)");
  });
});
