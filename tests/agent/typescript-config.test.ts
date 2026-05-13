import fs from "fs";
import path from "path";

describe("typescript config", () => {
  test("does not use deprecated baseUrl path resolution", () => {
    const tsconfigPath = path.resolve(__dirname, "../../tsconfig.json");
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
    const paths = tsconfig.compilerOptions.paths;

    expect(tsconfig.compilerOptions.baseUrl).toBeUndefined();
    expect(paths["@/*"]).toEqual(["./*"]);
    expect(paths["@src/*"]).toEqual(["./src/*"]);
    expect(paths["@recoil/*"]).toEqual(["./src/common/recoil/*"]);
    expect(paths["@utils/*"]).toEqual(["./src/common/utils/*"]);
    expect(paths["@types/*"]).toEqual(["./src/common/types/*"]);
    expect(paths["@common/*"]).toEqual(["./src/common/*"]);
  });
});
