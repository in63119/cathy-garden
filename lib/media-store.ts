import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createS3Client, getS3Config, streamToString } from "@/lib/s3";

export type MediaEntry = {
  id: string;
  objectKey: string;
  bucket: string;
  region: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

export type CreateMediaEntryInput = Omit<MediaEntry, "id" | "uploadedAt">;

function getManifestKey() {
  return process.env.AWS_S3_MEDIA_MANIFEST_KEY ?? "manifests/media-index.json";
}

function sortEntries(entries: MediaEntry[]) {
  return [...entries].sort((left, right) =>
    right.uploadedAt.localeCompare(left.uploadedAt)
  );
}

export async function readMediaEntries() {
  const config = getS3Config();
  const client = createS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: getManifestKey(),
      })
    );

    const body = response.Body
      ? await streamToString(response.Body)
      : "[]";
    const parsed = JSON.parse(body) as MediaEntry[];

    return sortEntries(parsed);
  } catch (error) {
    if (
      error instanceof NoSuchKey ||
      (error instanceof Error && error.name === "NoSuchKey")
    ) {
      return [];
    }

    throw error;
  }
}

export async function createMediaEntry(input: CreateMediaEntryInput) {
  const config = getS3Config();
  const client = createS3Client();
  const entries = await readMediaEntries();
  const entry: MediaEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uploadedAt: new Date().toISOString(),
    ...input,
  };
  const nextEntries = [entry, ...entries];

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: getManifestKey(),
      Body: `${JSON.stringify(sortEntries(nextEntries), null, 2)}\n`,
      ContentType: "application/json",
    })
  );

  return entry;
}
