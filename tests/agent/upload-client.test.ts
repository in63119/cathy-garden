import {
  completeUploadedMedia,
  formatBytes,
  requestPresignedUpload,
  uploadMediaBatch,
  uploadFileToPresignedUrl,
} from "../../lib/upload-client";

describe("upload client helpers", () => {
  const originalXmlHttpRequest = global.XMLHttpRequest;

  afterEach(() => {
    jest.restoreAllMocks();
    global.XMLHttpRequest = originalXmlHttpRequest;
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
    const send = jest.fn(function (this: {
      status: number;
      onload: null | (() => void);
      upload: { onprogress: null | ((event: ProgressEvent) => void) };
    }) {
      this.upload.onprogress?.({
        lengthComputable: true,
        loaded: 3,
        total: 6,
      } as ProgressEvent);
      this.status = 200;
      this.onload?.();
    });
    const open = jest.fn();
    const setRequestHeader = jest.fn();
    class MockXMLHttpRequest {
      status = 0;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      upload = { onprogress: null as null | ((event: ProgressEvent) => void) };
      open = open;
      setRequestHeader = setRequestHeader;
      send = send;
    }
    global.XMLHttpRequest = MockXMLHttpRequest as never;
    const file = new File(["garden"], "garden.jpg", {
      type: "image/jpeg",
    });
    const onProgress = jest.fn();

    await uploadFileToPresignedUrl({
      uploadUrl: "https://example.com/upload-url",
      file,
      contentType: "image/jpeg",
      onProgress,
    });

    expect(open).toHaveBeenCalledWith("PUT", "https://example.com/upload-url");
    expect(setRequestHeader).toHaveBeenCalledWith("Content-Type", "image/jpeg");
    expect(send).toHaveBeenCalledWith(file);
    expect(onProgress).toHaveBeenCalledWith({
      loaded: 3,
      total: 6,
      percentage: 50,
    });
    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: file.size,
      total: file.size,
      percentage: 100,
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
    const send = jest.fn(function (this: {
      status: number;
      onload: null | (() => void);
      onerror: null | (() => void);
    }) {
      this.status = 500;
      this.onload?.();
    });
    class MockXMLHttpRequest {
      status = 0;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      upload = { onprogress: null as null | ((event: ProgressEvent) => void) };
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = send;
    }
    global.XMLHttpRequest = MockXMLHttpRequest as never;
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

  test("retries a failed S3 transfer and then stores metadata", async () => {
    const send = jest.fn(function (this: {
      status: number;
      onload: null | (() => void);
      upload: { onprogress: null | ((event: ProgressEvent) => void) };
    }, file: File) {
      if (send.mock.calls.length === 1) {
        this.status = 500;
        this.onload?.();
        return;
      }

      this.upload.onprogress?.({
        lengthComputable: true,
        loaded: file.size,
        total: file.size,
      } as ProgressEvent);
      this.status = 200;
      this.onload?.();
    });
    class MockXMLHttpRequest {
      status = 0;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      upload = { onprogress: null as null | ((event: ProgressEvent) => void) };
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = send;
    }
    global.XMLHttpRequest = MockXMLHttpRequest as never;

    jest
      .spyOn(global, "fetch" as never)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadUrl: "https://example.com/upload-url",
          objectKey: "uploads/2026/05/07/retry.jpg",
          bucket: "garden-bucket",
          region: "ap-northeast-2",
          expiresIn: 300,
          contentType: "image/jpeg",
          fileName: "retry.jpg",
          size: 100,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entry: {
            id: "entry-retry",
            objectKey: "uploads/2026/05/07/retry.jpg",
            bucket: "garden-bucket",
            region: "ap-northeast-2",
            fileName: "retry.jpg",
            contentType: "image/jpeg",
            size: 100,
            uploadedAt: "2026-05-07T12:00:00.000Z",
          },
        }),
      } as Response);

    const onTransferRetry = jest.fn();
    const results = await uploadMediaBatch(
      [
        {
          file: new File(["retry"], "retry.jpg", { type: "image/jpeg" }),
          fileName: "retry.jpg",
          contentType: "image/jpeg",
          size: 100,
        },
      ],
      {
        maxTransferAttempts: 2,
        retryDelayMs: 0,
        onTransferRetry,
      }
    );

    expect(results[0].id).toBe("entry-retry");
    expect(send).toHaveBeenCalledTimes(2);
    expect(onTransferRetry).toHaveBeenCalledWith({
      index: 1,
      total: 1,
      fileName: "retry.jpg",
      attempt: 2,
      maxAttempts: 2,
      retryDelayMs: 0,
    });
  });

  test("stops retrying S3 transfers after the configured attempt limit", async () => {
    const send = jest.fn(function (this: {
      status: number;
      onload: null | (() => void);
    }) {
      this.status = 500;
      this.onload?.();
    });
    class MockXMLHttpRequest {
      status = 0;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      upload = { onprogress: null as null | ((event: ProgressEvent) => void) };
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = send;
    }
    global.XMLHttpRequest = MockXMLHttpRequest as never;

    const fetchMock = jest.spyOn(global, "fetch" as never).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uploadUrl: "https://example.com/upload-url",
        objectKey: "uploads/2026/05/07/fail.jpg",
        bucket: "garden-bucket",
        region: "ap-northeast-2",
        expiresIn: 300,
        contentType: "image/jpeg",
        fileName: "fail.jpg",
        size: 100,
      }),
    } as Response);

    await expect(
      uploadMediaBatch(
        [
          {
            file: new File(["fail"], "fail.jpg", { type: "image/jpeg" }),
            fileName: "fail.jpg",
            contentType: "image/jpeg",
            size: 100,
          },
        ],
        {
          maxTransferAttempts: 2,
          retryDelayMs: 0,
        }
      )
    ).rejects.toThrow("s3-upload-failed");

    expect(send).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("formats file sizes for display", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  test("uploads multiple files sequentially and stores metadata for each one", async () => {
    const send = jest.fn(function (this: {
      status: number;
      onload: null | (() => void);
      upload: { onprogress: null | ((event: ProgressEvent) => void) };
    }, file: File) {
      this.upload.onprogress?.({
        lengthComputable: true,
        loaded: file.size,
        total: file.size,
      } as ProgressEvent);
      this.status = 200;
      this.onload?.();
    });
    class MockXMLHttpRequest {
      status = 0;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      upload = { onprogress: null as null | ((event: ProgressEvent) => void) };
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = send;
    }
    global.XMLHttpRequest = MockXMLHttpRequest as never;

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
    const progressMarks: string[] = [];
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
        onTransferProgress: ({ index, percentage }) => {
          progressMarks.push(`${index}:${percentage}`);
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
    expect(progressMarks).toContain("1:100");
    expect(progressMarks).toContain("2:100");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
