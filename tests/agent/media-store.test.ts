jest.mock("@/lib/s3", () => ({
  createS3Client: jest.fn(),
  getS3Config: jest.fn(),
  streamToString: jest.fn(),
}));

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  createMediaEntry,
  deleteMediaEntryById,
  readMediaEntries,
} from "../../lib/media-store";
import {
  createS3Client,
  getS3Config,
  streamToString,
} from "../../lib/s3";

type MockSend = jest.Mock<Promise<unknown>, [unknown]>;

describe("media manifest store", () => {
  const send = jest.fn() as MockSend;

  beforeEach(() => {
    jest.clearAllMocks();
    (createS3Client as jest.Mock).mockReturnValue({ send });
    (getS3Config as jest.Mock).mockReturnValue({
      bucket: "garden-bucket",
      region: "ap-northeast-2",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
    (streamToString as jest.Mock).mockResolvedValue("[]");
  });

  test("reads an empty manifest when the object body is missing", async () => {
    send.mockResolvedValueOnce({
      Body: undefined,
      ETag: '"etag-1"',
    });

    await expect(readMediaEntries()).resolves.toEqual([]);
    expect(send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
  });

  test("retries manifest writes on conditional conflicts", async () => {
    (streamToString as jest.Mock)
      .mockResolvedValueOnce("[]")
      .mockResolvedValueOnce(
        JSON.stringify([
          {
            id: "existing-entry",
            objectKey: "uploads/2026/05/07/existing.jpg",
            bucket: "garden-bucket",
            region: "ap-northeast-2",
            fileName: "existing.jpg",
            contentType: "image/jpeg",
            size: 800,
            uploadedAt: "2026-05-07T09:00:00.000Z",
          },
        ])
      );

    send
      .mockResolvedValueOnce({
        Body: { transformToString: async () => "[]" },
        ETag: '"etag-1"',
      })
      .mockRejectedValueOnce(Object.assign(new Error("conflict"), { name: "PreconditionFailed" }))
      .mockResolvedValueOnce({
        Body: {
          transformToString: async () =>
            JSON.stringify([
              {
                id: "existing-entry",
                objectKey: "uploads/2026/05/07/existing.jpg",
                bucket: "garden-bucket",
                region: "ap-northeast-2",
                fileName: "existing.jpg",
                contentType: "image/jpeg",
                size: 800,
                uploadedAt: "2026-05-07T09:00:00.000Z",
              },
            ]),
        },
        ETag: '"etag-2"',
      })
      .mockResolvedValueOnce({});

    const createdEntry = await createMediaEntry({
      objectKey: "uploads/2026/05/07/new.jpg",
      bucket: "garden-bucket",
      region: "ap-northeast-2",
      fileName: "new.jpg",
      contentType: "image/jpeg",
      size: 1024,
    });

    const putCalls = send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof PutObjectCommand) as PutObjectCommand[];

    expect(putCalls).toHaveLength(2);
    expect(putCalls[0].input.IfMatch).toBe("etag-1");
    expect(putCalls[1].input.IfMatch).toBe("etag-2");

    const secondBody = String(putCalls[1].input.Body);
    expect(secondBody).toContain('"id": "existing-entry"');
    expect(secondBody).toContain(`"id": "${createdEntry.id}"`);
  });

  test("removes metadata after deleting the source object", async () => {
    const existingEntry = {
      id: "entry-1",
      objectKey: "uploads/2026/05/07/garden.jpg",
      bucket: "garden-bucket",
      region: "ap-northeast-2",
      fileName: "garden.jpg",
      contentType: "image/jpeg",
      size: 1024,
      uploadedAt: "2026-05-07T10:00:00.000Z",
    };

    (streamToString as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify([existingEntry]))
      .mockResolvedValueOnce(JSON.stringify([existingEntry]));

    send
      .mockResolvedValueOnce({
        Body: {
          transformToString: async () => JSON.stringify([existingEntry]),
        },
        ETag: '"etag-3"',
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Body: {
          transformToString: async () => JSON.stringify([existingEntry]),
        },
        ETag: '"etag-3"',
      })
      .mockResolvedValueOnce({});

    await expect(deleteMediaEntryById(existingEntry.id)).resolves.toEqual(existingEntry);

    const deleteCall = send.mock.calls.find(
      ([command]) => command instanceof DeleteObjectCommand
    )?.[0] as DeleteObjectCommand | undefined;
    const putCall = send.mock.calls.find(
      ([command]) => command instanceof PutObjectCommand
    )?.[0] as PutObjectCommand | undefined;

    expect(deleteCall?.input.Key).toBe(existingEntry.objectKey);
    expect(putCall?.input.IfMatch).toBe("etag-3");
    expect(String(putCall?.input.Body)).toContain("[]");
  });
});
