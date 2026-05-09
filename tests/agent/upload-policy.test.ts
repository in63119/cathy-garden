import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  buildContestCaptureObjectKey,
  buildThumbnailObjectKey,
  buildUploadObjectKey,
  sanitizeFileName,
  validateContestCaptureUploadRequest,
  validateUploadRequest,
} from "../../lib/upload-policy";

describe("upload policy", () => {
  test("sanitizes file names for object keys", () => {
    expect(sanitizeFileName("garden picnic.mov")).toBe("garden-picnic.mov");
    expect(sanitizeFileName("  spring<>photo?.jpg  ")).toBe(
      "springphoto.jpg"
    );
    expect(sanitizeFileName("###")).toBe("upload");
  });

  test("builds upload object keys under the uploads prefix", () => {
    const key = buildUploadObjectKey(
      "garden.jpg",
      new Date("2026-05-07T12:30:00.000Z")
    );

    expect(key.startsWith("uploads/2026/05/07/")).toBe(true);
    expect(key.endsWith("-garden.jpg")).toBe(true);
  });

  test("builds contest capture object keys under the contests prefix", () => {
    const key = buildContestCaptureObjectKey(
      "contest screen.png",
      new Date("2026-05-07T12:30:00.000Z")
    );

    expect(key.startsWith("contests/captures/2026/05/07/")).toBe(true);
    expect(key.endsWith("-contest-screen.png")).toBe(true);
  });

  test("builds thumbnail object keys under the thumbnails prefix", () => {
    expect(buildThumbnailObjectKey("uploads/2026/05/07/garden.jpg")).toBe(
      "thumbnails/2026/05/07/garden.jpg.jpg"
    );
    expect(() => buildThumbnailObjectKey("media/garden.jpg")).toThrow(
      "invalid-thumbnail-source-key"
    );
  });

  test("accepts valid image and video uploads", () => {
    expect(
      validateUploadRequest({
        fileName: "photo.jpg",
        contentType: "image/jpeg",
        size: 1024,
      }).ok
    ).toBe(true);

    expect(
      validateUploadRequest({
        fileName: "clip.mp4",
        contentType: "video/mp4",
        size: 1024 * 1024,
      }).ok
    ).toBe(true);
  });

  test("rejects invalid upload requests", () => {
    expect(validateUploadRequest({}).ok).toBe(false);
    expect(
      validateUploadRequest({
        fileName: "garden.gif",
        contentType: "image/gif",
        size: 1024,
      })
    ).toEqual({
      ok: false,
      reason: "unsupported-content-type",
    });
    expect(
      validateUploadRequest({
        fileName: "huge.mp4",
        contentType: "video/mp4",
        size: MAX_UPLOAD_SIZE_BYTES + 1,
      })
    ).toEqual({
      ok: false,
      reason: "file-too-large",
    });
  });

  test("accepts only image uploads for contest captures", () => {
    expect(
      validateContestCaptureUploadRequest({
        fileName: "capture.png",
        contentType: "image/png",
        size: 1024,
      }).ok
    ).toBe(true);

    expect(
      validateContestCaptureUploadRequest({
        fileName: "capture.mp4",
        contentType: "video/mp4",
        size: 1024,
      })
    ).toEqual({
      ok: false,
      reason: "unsupported-content-type",
    });
  });

  test("documents the allowed S3 upload content types", () => {
    expect(ALLOWED_UPLOAD_MIME_TYPES).toEqual(
      expect.arrayContaining(["image/jpeg", "video/mp4", "video/quicktime"])
    );
  });
});
