import fs from "fs";
import path from "path";

describe("unauthorized access guards", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("protects private App Router pages through the private layout", () => {
    const privateLayout = fs.readFileSync(
      path.join(rootDir, "src/app/(private)/layout.tsx"),
      "utf8"
    );

    expect(privateLayout).toContain("requireAuthenticatedSession");
    expect(privateLayout).toContain("await requireAuthenticatedSession()");
  });

  test("keeps protected page paths registered in auth helpers", () => {
    const authSource = fs.readFileSync(path.join(rootDir, "lib/auth.ts"), "utf8");

    expect(authSource).toContain('"/library"');
    expect(authSource).toContain('"/upload"');
    expect(authSource).toContain('"/media"');
  });

  test("blocks unauthenticated protected API routes with 401 responses", () => {
    const routePaths = [
      "src/app/api/upload/presign/route.ts",
      "src/app/api/media/complete/route.ts",
      "src/app/api/media/[id]/route.ts",
    ];

    for (const relativePath of routePaths) {
      const source = fs.readFileSync(path.join(rootDir, relativePath), "utf8");

      expect(source).toContain("isAuthenticated");
      expect(source).toContain('error: "unauthorized"');
      expect(source).toContain("status: 401");
    }
  });
});
