import {
  filterAndSortMediaEntries,
  getMediaArchiveDate,
  getMediaKindLabel,
  isImageContentType,
  isVideoContentType,
  normalizeMediaFilterValue,
  normalizeMediaSortValue,
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

  test("normalizes filter and sort query values", () => {
    expect(normalizeMediaFilterValue("image")).toBe("image");
    expect(normalizeMediaFilterValue("video")).toBe("video");
    expect(normalizeMediaFilterValue("favorite")).toBe("favorite");
    expect(normalizeMediaFilterValue("weird")).toBe("all");
    expect(normalizeMediaSortValue("oldest")).toBe("oldest");
    expect(normalizeMediaSortValue("whatever")).toBe("newest");
  });

  test("filters and sorts media entries", () => {
    const entries = [
      {
        contentType: "video/mp4",
        uploadedAt: "2026-05-07T12:00:00.000Z",
      },
      {
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
      },
      {
        contentType: "image/png",
        uploadedAt: "2026-05-06T12:00:00.000Z",
      },
    ];

    expect(
      filterAndSortMediaEntries(entries, {
        filter: "image",
        sort: "newest",
      }).map((entry) => entry.contentType)
    ).toEqual(["image/jpeg", "image/png"]);

    expect(
      filterAndSortMediaEntries(entries, {
        filter: "all",
        sort: "oldest",
      }).map((entry) => entry.uploadedAt)
    ).toEqual([
      "2026-05-06T12:00:00.000Z",
      "2026-05-07T12:00:00.000Z",
      "2026-05-08T12:00:00.000Z",
    ]);
  });

  test("uses taken date before upload date for archive ordering", () => {
    const entries = [
      {
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
        takenAt: "2026-05-05T12:00:00.000Z",
      },
      {
        contentType: "image/png",
        uploadedAt: "2026-05-07T12:00:00.000Z",
        takenAt: "2026-05-09T12:00:00.000Z",
      },
      {
        contentType: "video/mp4",
        uploadedAt: "2026-05-06T12:00:00.000Z",
      },
    ];

    expect(getMediaArchiveDate(entries[0])).toBe("2026-05-05T12:00:00.000Z");
    expect(
      filterAndSortMediaEntries(entries, {
        filter: "all",
        sort: "newest",
      }).map((entry) => entry.contentType)
    ).toEqual(["image/png", "video/mp4", "image/jpeg"]);
  });

  test("filters favorite media entries", () => {
    const entries = [
      {
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
        favorite: true,
      },
      {
        contentType: "video/mp4",
        uploadedAt: "2026-05-07T12:00:00.000Z",
      },
    ];

    expect(
      filterAndSortMediaEntries(entries, {
        filter: "favorite",
        sort: "newest",
      }).map((entry) => entry.contentType)
    ).toEqual(["image/jpeg"]);
  });
});
