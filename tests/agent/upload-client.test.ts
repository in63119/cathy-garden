import {
  formatBytes,
  requestPresignedUpload,
} from "../../lib/upload-client";

describe("upload client helpers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("requests a presigned upload URL with the expected payload", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        uploadUrl: "https://example.com/upload",
        objectKey: "uploads/2026/05/07/example.jpg",
        bucket: "garden-bucket",
        region: "ap-northeast-2",
        expiresIn: 300,
        contentType: "image/jpeg",
        fileName: "example.jpg",
        size: 1024,
      }),
    } as Response);

    const result = await requestPresignedUpload({
      fileName: "example.jpg",
      contentType: "image/jpeg",
      size: 1024,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/upload/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "example.jpg",
        contentType: "image/jpeg",
        size: 1024,
      }),
    });

    expect(result.objectKey).toBe("uploads/2026/05/07/example.jpg");
    expect(result.bucket).toBe("garden-bucket");
  });

  test("surfaces API errors from the presign endpoint", async () => {
    jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "unsupported-content-type",
      }),
    } as Response);

    await expect(
      requestPresignedUpload({
        fileName: "bad.gif",
        contentType: "image/gif",
        size: 512,
      })
    ).rejects.toThrow("unsupported-content-type");
  });

  test("formats file sizes for display", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
