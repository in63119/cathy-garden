import { validateCompleteUploadPayload } from "../../lib/media-metadata";

describe("media metadata validation", () => {
  test("accepts a complete upload payload", () => {
    expect(
      validateCompleteUploadPayload({
        objectKey: "uploads/2026/05/07/garden.jpg",
        bucket: "garden-bucket",
        region: "ap-northeast-2",
        fileName: "garden.jpg",
        contentType: "image/jpeg",
        size: 1024,
        takenAt: "2026-05-06T09:30:00.000Z",
        thumbnailObjectKey: "thumbnails/2026/05/07/garden.jpg.jpg",
      })
    ).toEqual({
      ok: true,
      normalized: {
        objectKey: "uploads/2026/05/07/garden.jpg",
        bucket: "garden-bucket",
        region: "ap-northeast-2",
        fileName: "garden.jpg",
        contentType: "image/jpeg",
        size: 1024,
        takenAt: "2026-05-06T09:30:00.000Z",
        thumbnailObjectKey: "thumbnails/2026/05/07/garden.jpg.jpg",
      },
    });
  });

  test("rejects incomplete payloads", () => {
    expect(validateCompleteUploadPayload({})).toEqual({
      ok: false,
      reason: "missing-object-key",
    });

    expect(
      validateCompleteUploadPayload({
        objectKey: "uploads/example.jpg",
        bucket: "garden-bucket",
        region: "ap-northeast-2",
        fileName: "garden.jpg",
        contentType: "image/jpeg",
        size: 0,
      })
    ).toEqual({
      ok: false,
      reason: "invalid-size",
    });

    expect(
      validateCompleteUploadPayload({
        objectKey: "uploads/example.jpg",
        bucket: "garden-bucket",
        region: "ap-northeast-2",
        fileName: "garden.jpg",
        contentType: "image/jpeg",
        size: 1024,
        takenAt: "not-a-date",
      })
    ).toEqual({
      ok: false,
      reason: "invalid-taken-at",
    });

    expect(
      validateCompleteUploadPayload({
        objectKey: "uploads/example.jpg",
        bucket: "garden-bucket",
        region: "ap-northeast-2",
        fileName: "garden.jpg",
        contentType: "image/jpeg",
        size: 1024,
        thumbnailObjectKey: "uploads/not-a-thumbnail.jpg",
      })
    ).toEqual({
      ok: false,
      reason: "invalid-thumbnail-key",
    });
  });
});
