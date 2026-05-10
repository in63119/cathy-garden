import fs from "fs";
import path from "path";

describe("home screen icon metadata", () => {
  test("connects the app router layout to installable app icons", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const layoutSource = fs.readFileSync(
      path.join(rootDir, "src/app/layout.tsx"),
      "utf8",
    );

    expect(layoutSource).toContain('manifest: "/manifest.json"');
    expect(layoutSource).toContain('icon: "/favicon.ico"');
    expect(layoutSource).toContain('apple: "/apple-touch-icon.png"');
    expect(layoutSource).toContain("appleWebApp");
    expect(fs.existsSync(path.join(rootDir, "public/apple-touch-icon.png"))).toBe(
      true,
    );
  });

  test("uses Cathy Garden branding in the web app manifest", () => {
    const manifestPath = path.resolve(__dirname, "../../public/manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const iconSources = manifest.icons.map((icon: { src: string }) => icon.src);

    expect(manifest.short_name).toBe("Cathy Garden");
    expect(manifest.name).toBe("Cathy Garden");
    expect(manifest.start_url).toBe("/");
    expect(manifest.theme_color).toBe("#f8f6ee");
    expect(iconSources).toContain("favicon.ico");
    expect(iconSources).toContain("apple-touch-icon.png");
    expect(iconSources).toContain("logo192.png");
    expect(iconSources).toContain("logo512.png");
  });
});
