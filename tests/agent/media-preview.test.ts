import {
  getMediaKindLabel,
  isImageContentType,
  isVideoContentType,
} from "../../lib/media-preview";

describe("media preview helpers", () => {
  test("detects image content types", () => {
    expect(isImageContentType("image/jpeg")).toBe(true);
    expect(isImageContentType("image/heic")).toBe(true);
    expect(isImageContentType("video/mp4")).toBe(false);
  });

  test("detects video content types", () => {
    expect(isVideoContentType("video/mp4")).toBe(true);
    expect(isVideoContentType("video/quicktime")).toBe(true);
    expect(isVideoContentType("image/jpeg")).toBe(false);
  });

  test("labels media kinds for detail-page rendering", () => {
    expect(getMediaKindLabel("image/jpeg")).toBe("image");
    expect(getMediaKindLabel("video/mp4")).toBe("video");
    expect(getMediaKindLabel("application/pdf")).toBe("file");
  });
});
