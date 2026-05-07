import {
  completeUploadedMedia,
  formatBytes,
  requestPresignedUpload,
  uploadMediaBatch,
  uploadFileToPresignedUrl,
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

  test("uploads a selected file directly to the presigned URL", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: true,
    } as Response);
    const file = new File(["garden"], "garden.jpg", {
      type: "image/jpeg",
    });

    await uploadFileToPresignedUrl({
      uploadUrl: "https://example.com/upload-url",
      file,
      contentType: "image/jpeg",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/upload-url", {
      method: "PUT",
      headers: {
        "Content-Type": "image/jpeg",
      },
      body: file,
    });
  });

  test("stores upload metadata after the direct S3 upload finishes", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        entry: {
          id: "entry-1",
          objectKey: "uploads/2026/05/07/example.jpg",
          bucket: "garden-bucket",
          region: "ap-northeast-2",
          fileName: "example.jpg",
          contentType: "image/jpeg",
          size: 1024,
          uploadedAt: "2026-05-07T12:00:00.000Z",
        },
      }),
    } as Response);

    const result = await completeUploadedMedia({
      objectKey: "uploads/2026/05/07/example.jpg",
      bucket: "garden-bucket",
      region: "ap-northeast-2",
      fileName: "example.jpg",
      contentType: "image/jpeg",
      size: 1024,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/media/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        objectKey: "uploads/2026/05/07/example.jpg",
        bucket: "garden-bucket",
        region: "ap-northeast-2",
        fileName: "example.jpg",
        contentType: "image/jpeg",
        size: 1024,
      }),
    });
    expect(result.id).toBe("entry-1");
  });

  test("throws when the direct S3 upload fails", async () => {
    jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: false,
    } as Response);
    const file = new File(["garden"], "garden.jpg", {
      type: "image/jpeg",
    });

    await expect(
      uploadFileToPresignedUrl({
        uploadUrl: "https://example.com/upload-url",
        file,
        contentType: "image/jpeg",
      })
    ).rejects.toThrow("s3-upload-failed");
  });

  test("formats file sizes for display", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  test("uploads multiple files sequentially and stores metadata for each one", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch" as never)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadUrl: "https://example.com/upload-1",
          objectKey: "uploads/2026/05/07/one.jpg",
          bucket: "garden-bucket",
          region: "ap-northeast-2",
          expiresIn: 300,
          contentType: "image/jpeg",
          fileName: "one.jpg",
          size: 100,
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entry: {
            id: "entry-1",
            objectKey: "uploads/2026/05/07/one.jpg",
            bucket: "garden-bucket",
            region: "ap-northeast-2",
            fileName: "one.jpg",
            contentType: "image/jpeg",
            size: 100,
            uploadedAt: "2026-05-07T12:00:00.000Z",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadUrl: "https://example.com/upload-2",
          objectKey: "uploads/2026/05/07/two.jpg",
          bucket: "garden-bucket",
          region: "ap-northeast-2",
          expiresIn: 300,
          contentType: "image/jpeg",
          fileName: "two.jpg",
          size: 200,
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entry: {
            id: "entry-2",
            objectKey: "uploads/2026/05/07/two.jpg",
            bucket: "garden-bucket",
            region: "ap-northeast-2",
            fileName: "two.jpg",
            contentType: "image/jpeg",
            size: 200,
            uploadedAt: "2026-05-07T12:00:10.000Z",
          },
        }),
      } as Response);

    const stages: string[] = [];
    const results = await uploadMediaBatch(
      [
        {
          file: new File(["one"], "one.jpg", { type: "image/jpeg" }),
          fileName: "one.jpg",
          contentType: "image/jpeg",
          size: 100,
        },
        {
          file: new File(["two"], "two.jpg", { type: "image/jpeg" }),
          fileName: "two.jpg",
          contentType: "image/jpeg",
          size: 200,
        },
      ],
      {
        onStageChange: ({ index, stage }) => {
          stages.push(`${index}:${stage}`);
        },
      }
    );

    expect(results.map((entry) => entry.id)).toEqual(["entry-1", "entry-2"]);
    expect(stages).toEqual([
      "1:presign",
      "1:transfer",
      "1:complete",
      "2:presign",
      "2:transfer",
      "2:complete",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
