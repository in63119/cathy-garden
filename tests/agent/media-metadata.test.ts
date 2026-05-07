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
  });
});
