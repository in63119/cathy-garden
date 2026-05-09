import fs from "fs";
import path from "path";

describe("hero visual layout", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("places the feature image in the hero copy instead of home buttons", () => {
    const heroSource = fs.readFileSync(
      path.join(rootDir, "components/hero-section.tsx"),
      "utf8",
    );

    expect(heroSource).toContain('className="hero-feature-panel"');
    expect(heroSource).toContain('className="hero-media-frame"');
    expect(heroSource).toContain('className="hero-media-caption"');
    expect(heroSource).toContain("한 사람만을 위한");
    expect(heroSource).not.toContain("사진 열기");
    expect(heroSource).not.toContain("사진 올리기");
  });

  test("styles the hero as a single personal feature panel", () => {
    const globalStyles = fs.readFileSync(
      path.join(rootDir, "src/app/globals.css"),
      "utf8",
    );

    expect(globalStyles).toContain("grid-template-columns: 1fr");
    expect(globalStyles).toContain(".hero-feature-panel");
    expect(globalStyles).toContain(".hero-media-frame");
    expect(globalStyles).toContain("border-radius: 34px");
  });

  test("positions the homepage around a one-person utility site", () => {
    const homePageSource = fs.readFileSync(
      path.join(rootDir, "src/app/page.tsx"),
      "utf8",
    );

    expect(homePageSource).toContain("한 사람의 흐름");
    expect(homePageSource).not.toContain("사진과 영상을 올리고");
  });
});
