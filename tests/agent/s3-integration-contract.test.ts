jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  PRESIGNED_URL_EXPIRES_IN_SECONDS,
} from "../../lib/upload-policy";
import {
  createPresignedDownload,
  createPresignedThumbnailUpload,
  createPresignedUpload,
  getS3Config,
} from "../../lib/s3";

describe("S3 storage integration contract", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AWS_REGION: "ap-northeast-2",
      AWS_S3_BUCKET: "garden-bucket",
      AWS_ACCESS_KEY_ID: "test-access-key",
      AWS_SECRET_ACCESS_KEY: "test-secret-key",
    };
    (getSignedUrl as jest.Mock).mockResolvedValue(
      "https://storage.example.test/upload"
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("requires the S3 environment variables used by Vercel", () => {
    expect(getS3Config()).toEqual({
      region: "ap-northeast-2",
      bucket: "garden-bucket",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
    });

    delete process.env.AWS_S3_BUCKET;

    expect(() => getS3Config()).toThrow(
      "Missing required environment variable: AWS_S3_BUCKET"
    );
  });

  test("creates a presigned PUT upload under the uploads prefix", async () => {
    const result = await createPresignedUpload({
      fileName: "garden photo.jpg",
      contentType: "image/jpeg",
      size: 1024,
    });

    const command = (getSignedUrl as jest.Mock).mock.calls[0][1] as PutObjectCommand;
    const options = (getSignedUrl as jest.Mock).mock.calls[0][2];

    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input.Bucket).toBe("garden-bucket");
    expect(command.input.Key).toMatch(/^uploads\/\d{4}\/\d{2}\/\d{2}\//);
    expect(command.input.Key).toContain("garden-photo.jpg");
    expect(command.input.ContentType).toBe("image/jpeg");
    expect(command.input.ContentLength).toBe(1024);
    expect(options).toEqual({
      expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
    });
    expect(result).toMatchObject({
      uploadUrl: "https://storage.example.test/upload",
      bucket: "garden-bucket",
      region: "ap-northeast-2",
      expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
    });
  });

  test("uses the same short expiry for signed downloads", async () => {
    await createPresignedDownload({
      bucket: "garden-bucket",
      objectKey: "uploads/2026/05/07/garden.jpg",
      contentType: "image/jpeg",
    });

    const command = (getSignedUrl as jest.Mock).mock.calls[0][1] as GetObjectCommand;
    const options = (getSignedUrl as jest.Mock).mock.calls[0][2];

    expect(PRESIGNED_URL_EXPIRES_IN_SECONDS).toBe(300);
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input.Bucket).toBe("garden-bucket");
    expect(command.input.Key).toBe("uploads/2026/05/07/garden.jpg");
    expect(command.input.ResponseContentType).toBe("image/jpeg");
    expect(options).toEqual({
      expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
    });
  });

  test("creates presigned thumbnail uploads under the thumbnails prefix", async () => {
    const result = await createPresignedThumbnailUpload({
      objectKey: "uploads/2026/05/07/garden.jpg",
    });

    const command = (getSignedUrl as jest.Mock).mock.calls[0][1] as PutObjectCommand;
    const options = (getSignedUrl as jest.Mock).mock.calls[0][2];

    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input.Bucket).toBe("garden-bucket");
    expect(command.input.Key).toBe("thumbnails/2026/05/07/garden.jpg.jpg");
    expect(command.input.ContentType).toBe("image/jpeg");
    expect(options).toEqual({
      expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
    });
    expect(result.objectKey).toBe("thumbnails/2026/05/07/garden.jpg.jpg");
  });
});
