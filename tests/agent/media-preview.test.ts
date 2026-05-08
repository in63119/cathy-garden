import {
  filterAndSortMediaEntries,
  getMediaArchiveDate,
  getMediaKindLabel,
  isImageContentType,
  isVideoContentType,
  normalizeMediaFilterValue,
  normalizeMediaAlbum,
  normalizeMediaAlbumFilter,
  normalizeMediaAlbums,
  normalizeMediaSearchQuery,
  normalizeMediaTag,
  normalizeMediaTagFilter,
  normalizeMediaTags,
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
        fileName: "garden-video.mp4",
        contentType: "video/mp4",
        uploadedAt: "2026-05-07T12:00:00.000Z",
      },
      {
        fileName: "spring-photo.jpg",
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
      },
      {
        fileName: "porch.png",
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
        fileName: "early.jpg",
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
        takenAt: "2026-05-05T12:00:00.000Z",
      },
      {
        fileName: "late.png",
        contentType: "image/png",
        uploadedAt: "2026-05-07T12:00:00.000Z",
        takenAt: "2026-05-09T12:00:00.000Z",
      },
      {
        fileName: "middle.mp4",
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
        fileName: "favorite.jpg",
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
        favorite: true,
      },
      {
        fileName: "plain.mp4",
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

  test("normalizes and applies file name search queries", () => {
    const entries = [
      {
        fileName: "Spring Garden.JPG",
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
      },
      {
        fileName: "birthday-video.mp4",
        contentType: "video/mp4",
        uploadedAt: "2026-05-07T12:00:00.000Z",
        favorite: true,
      },
      {
        fileName: "porch.png",
        contentType: "image/png",
        uploadedAt: "2026-05-06T12:00:00.000Z",
      },
    ];

    expect(normalizeMediaSearchQuery("  spring   garden  ")).toBe(
      "spring garden"
    );
    expect(
      filterAndSortMediaEntries(entries, {
        filter: "all",
        sort: "newest",
        query: "garden",
      }).map((entry) => entry.fileName)
    ).toEqual(["Spring Garden.JPG"]);
    expect(
      filterAndSortMediaEntries(entries, {
        filter: "favorite",
        sort: "newest",
        query: "birthday",
      }).map((entry) => entry.fileName)
    ).toEqual(["birthday-video.mp4"]);
  });

  test("normalizes and filters media tags", () => {
    const entries = [
      {
        fileName: "garden.jpg",
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
        tags: ["Garden", "Spring"],
      },
      {
        fileName: "porch.jpg",
        contentType: "image/jpeg",
        uploadedAt: "2026-05-07T12:00:00.000Z",
        tags: ["Porch"],
      },
    ];

    expect(normalizeMediaTag("  spring   garden  ")).toBe("spring garden");
    expect(normalizeMediaTagFilter(" Garden ")).toBe("Garden");
    expect(normalizeMediaTags(["Garden", "Garden", "  Porch  ", ""])).toEqual([
      "Garden",
      "Porch",
    ]);
    expect(
      filterAndSortMediaEntries(entries, {
        filter: "all",
        sort: "newest",
        tag: "garden",
      }).map((entry) => entry.fileName)
    ).toEqual(["garden.jpg"]);
  });

  test("normalizes and filters media albums", () => {
    const entries = [
      {
        fileName: "garden.jpg",
        contentType: "image/jpeg",
        uploadedAt: "2026-05-08T12:00:00.000Z",
        albums: ["Spring Garden"],
      },
      {
        fileName: "birthday.mp4",
        contentType: "video/mp4",
        uploadedAt: "2026-05-07T12:00:00.000Z",
        albums: ["Birthday"],
      },
    ];

    expect(normalizeMediaAlbum("  Spring   Garden  ")).toBe("Spring Garden");
    expect(normalizeMediaAlbumFilter(" Birthday ")).toBe("Birthday");
    expect(
      normalizeMediaAlbums(["Spring Garden", "Spring Garden", "Birthday", ""])
    ).toEqual(["Spring Garden", "Birthday"]);
    expect(
      filterAndSortMediaEntries(entries, {
        filter: "all",
        sort: "newest",
        album: "spring garden",
      }).map((entry) => entry.fileName)
    ).toEqual(["garden.jpg"]);
  });
});
