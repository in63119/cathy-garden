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
  findDuplicateMediaEntry,
  getMediaEntryByShareToken,
  readMediaEntries,
  updateMediaEntryAlbums,
  updateMediaEntryFavorite,
  updateMediaEntrySharing,
  updateMediaEntryTags,
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

  test("finds duplicate media by file name, content type, and size", async () => {
    const existingEntry = {
      id: "entry-1",
      objectKey: "uploads/2026/05/07/garden.jpg",
      bucket: "garden-bucket",
      region: "ap-northeast-2",
      fileName: "Garden.JPG",
      contentType: "image/jpeg",
      size: 1024,
      uploadedAt: "2026-05-07T10:00:00.000Z",
      thumbnailObjectKey: "thumbnails/2026/05/07/garden.jpg.jpg",
    };

    (streamToString as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([existingEntry])
    );

    send.mockResolvedValueOnce({
      Body: {
        transformToString: async () => JSON.stringify([existingEntry]),
      },
      ETag: '"etag-duplicate"',
    });

    await expect(
      findDuplicateMediaEntry({
        fileName: "garden.jpg",
        contentType: "image/jpeg",
        size: 1024,
      })
    ).resolves.toEqual(existingEntry);
  });

  test("finds media by share token", async () => {
    const existingEntry = {
      id: "entry-1",
      objectKey: "uploads/2026/05/07/garden.jpg",
      bucket: "garden-bucket",
      region: "ap-northeast-2",
      fileName: "garden.jpg",
      contentType: "image/jpeg",
      size: 1024,
      uploadedAt: "2026-05-07T10:00:00.000Z",
      shareToken: "share-token",
    };

    (streamToString as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([existingEntry])
    );

    send.mockResolvedValueOnce({
      Body: {
        transformToString: async () => JSON.stringify([existingEntry]),
      },
      ETag: '"etag-share"',
    });

    await expect(getMediaEntryByShareToken("share-token")).resolves.toEqual(
      existingEntry
    );
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
      takenAt: "2026-05-06T09:30:00.000Z",
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
    expect(secondBody).toContain('"takenAt": "2026-05-06T09:30:00.000Z"');
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
      thumbnailObjectKey: "thumbnails/2026/05/07/garden.jpg.jpg",
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
    expect(
      send.mock.calls.some(
        ([command]) =>
          command instanceof DeleteObjectCommand &&
          command.input.Key === existingEntry.thumbnailObjectKey
      )
    ).toBe(true);
    expect(putCall?.input.IfMatch).toBe("etag-3");
    expect(String(putCall?.input.Body)).toContain("[]");
  });

  test("updates the favorite flag without deleting the source object", async () => {
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

    (streamToString as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([existingEntry])
    );

    send
      .mockResolvedValueOnce({
        Body: {
          transformToString: async () => JSON.stringify([existingEntry]),
        },
        ETag: '"etag-4"',
      })
      .mockResolvedValueOnce({});

    await expect(updateMediaEntryFavorite(existingEntry.id, true)).resolves.toEqual({
      ...existingEntry,
      favorite: true,
    });

    const deleteCalls = send.mock.calls.filter(
      ([command]) => command instanceof DeleteObjectCommand
    );
    const putCall = send.mock.calls.find(
      ([command]) => command instanceof PutObjectCommand
    )?.[0] as PutObjectCommand | undefined;

    expect(deleteCalls).toHaveLength(0);
    expect(putCall?.input.IfMatch).toBe("etag-4");
    expect(String(putCall?.input.Body)).toContain('"favorite": true');
  });

  test("does not rewrite the manifest when favorite target is missing", async () => {
    (streamToString as jest.Mock).mockResolvedValueOnce("[]");

    send.mockResolvedValueOnce({
      Body: {
        transformToString: async () => "[]",
      },
      ETag: '"etag-5"',
    });

    await expect(updateMediaEntryFavorite("missing-entry", true)).resolves.toBeNull();

    const putCalls = send.mock.calls.filter(
      ([command]) => command instanceof PutObjectCommand
    );

    expect(putCalls).toHaveLength(0);
  });

  test("updates tags without deleting the source object", async () => {
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

    (streamToString as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([existingEntry])
    );

    send
      .mockResolvedValueOnce({
        Body: {
          transformToString: async () => JSON.stringify([existingEntry]),
        },
        ETag: '"etag-6"',
      })
      .mockResolvedValueOnce({});

    await expect(
      updateMediaEntryTags(existingEntry.id, ["Garden", "Spring"])
    ).resolves.toEqual({
      ...existingEntry,
      tags: ["Garden", "Spring"],
    });

    const deleteCalls = send.mock.calls.filter(
      ([command]) => command instanceof DeleteObjectCommand
    );
    const putCall = send.mock.calls.find(
      ([command]) => command instanceof PutObjectCommand
    )?.[0] as PutObjectCommand | undefined;

    expect(deleteCalls).toHaveLength(0);
    expect(putCall?.input.IfMatch).toBe("etag-6");
    expect(String(putCall?.input.Body)).toContain('"tags": [');
    expect(String(putCall?.input.Body)).toContain('"Garden"');
  });

  test("updates albums without deleting the source object", async () => {
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

    (streamToString as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([existingEntry])
    );

    send
      .mockResolvedValueOnce({
        Body: {
          transformToString: async () => JSON.stringify([existingEntry]),
        },
        ETag: '"etag-7"',
      })
      .mockResolvedValueOnce({});

    await expect(
      updateMediaEntryAlbums(existingEntry.id, ["Spring Garden"])
    ).resolves.toEqual({
      ...existingEntry,
      albums: ["Spring Garden"],
    });

    const deleteCalls = send.mock.calls.filter(
      ([command]) => command instanceof DeleteObjectCommand
    );
    const putCall = send.mock.calls.find(
      ([command]) => command instanceof PutObjectCommand
    )?.[0] as PutObjectCommand | undefined;

    expect(deleteCalls).toHaveLength(0);
    expect(putCall?.input.IfMatch).toBe("etag-7");
    expect(String(putCall?.input.Body)).toContain('"albums": [');
    expect(String(putCall?.input.Body)).toContain('"Spring Garden"');
  });

  test("creates and disables share tokens", async () => {
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
      .mockResolvedValueOnce(
        JSON.stringify([
          {
            ...existingEntry,
            shareToken: "existing-share-token",
            sharedAt: "2026-05-07T10:10:00.000Z",
          },
        ])
      );

    send
      .mockResolvedValueOnce({
        Body: {
          transformToString: async () => JSON.stringify([existingEntry]),
        },
        ETag: '"etag-share-1"',
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Body: {
          transformToString: async () =>
            JSON.stringify([
              {
                ...existingEntry,
                shareToken: "existing-share-token",
                sharedAt: "2026-05-07T10:10:00.000Z",
              },
            ]),
        },
        ETag: '"etag-share-2"',
      })
      .mockResolvedValueOnce({});

    const sharedEntry = await updateMediaEntrySharing(existingEntry.id, true);

    expect(sharedEntry?.shareToken).toHaveLength(48);
    expect(sharedEntry?.sharedAt).toBeDefined();

    await expect(
      updateMediaEntrySharing(existingEntry.id, false)
    ).resolves.toMatchObject({
      ...existingEntry,
      shareToken: undefined,
      sharedAt: undefined,
    });
  });
});
