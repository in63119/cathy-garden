import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  PRESIGNED_URL_EXPIRES_IN_SECONDS,
  buildUploadObjectKey,
} from "@/lib/upload-policy";

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getS3Config() {
  return {
    region: readRequiredEnv("AWS_REGION"),
    bucket: readRequiredEnv("AWS_S3_BUCKET"),
    accessKeyId: readRequiredEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: readRequiredEnv("AWS_SECRET_ACCESS_KEY"),
  };
}

export function createS3Client() {
  const config = getS3Config();

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function createPresignedUpload(params: {
  fileName: string;
  contentType: string;
  size: number;
}) {
  const config = getS3Config();
  const client = createS3Client();
  const objectKey = buildUploadObjectKey(params.fileName);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ContentType: params.contentType,
    ContentLength: params.size,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
  });

  return {
    uploadUrl,
    objectKey,
    bucket: config.bucket,
    region: config.region,
    expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
  };
}
