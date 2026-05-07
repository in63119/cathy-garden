import { PageUrls } from "../../src/common/constants/page-urls";

describe("route constants", () => {
  test("defines the expected baseline routes", () => {
    expect(PageUrls.INTRO).toBe("/");
    expect(PageUrls.AUTH.LOGIN).toBe("/login");
    expect(PageUrls.AUTH.CALLBACK).toBe("/callback");
    expect(PageUrls.HOUSE.GARDEN).toBe("/house/garden");
  });
});
