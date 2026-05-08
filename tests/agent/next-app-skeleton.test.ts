import fs from "fs";
import path from "path";

describe("next app skeleton", () => {
  test("keeps the core App Router files in place", () => {
    const rootDir = path.resolve(__dirname, "../..");
    const requiredFiles = [
      "src/app/layout.tsx",
      "src/app/page.tsx",
      "src/app/login/page.tsx",
      "src/app/(private)/layout.tsx",
      "src/app/(private)/library/page.tsx",
      "src/app/(private)/upload/page.tsx",
      "src/app/(private)/media/[id]/page.tsx",
      "src/app/api/auth/login/route.ts",
      "src/app/api/auth/logout/route.ts",
      "src/app/api/media/complete/route.ts",
      "src/app/api/media/[id]/route.ts",
      "src/app/api/upload/presign/route.ts",
      "src/app/api/upload/thumbnail/route.ts",
      "src/app/globals.css",
      "components/app-shell.tsx",
      "components/delete-media-button.tsx",
      "components/site-header.tsx",
      "components/hero-section.tsx",
      "components/section-card.tsx",
      "components/upload-request-panel.tsx",
      "lib/auth.ts",
      "lib/auth-server.ts",
      "lib/media-metadata.ts",
      "lib/media-store.ts",
      "lib/upload-client.ts",
      "lib/s3.ts",
      "lib/upload-policy.ts",
      "next.config.ts",
      "next-env.d.ts",
    ];

    for (const relativePath of requiredFiles) {
      expect(fs.existsSync(path.join(rootDir, relativePath))).toBe(true);
    }
  });

  test("switches runtime scripts to Next.js while keeping legacy CRA fallbacks", () => {
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    expect(packageJson.scripts.dev).toBe("next dev");
    expect(packageJson.scripts.build).toBe("next build");
    expect(packageJson.scripts.start).toBe("next start");
    expect(packageJson.scripts["legacy:start"]).toBe("craco start");
    expect(packageJson.dependencies.next).toBeDefined();
  });
});
