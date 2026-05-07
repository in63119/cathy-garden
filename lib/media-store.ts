import {
  DeleteObjectCommand,
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

type ManifestState = {
  entries: MediaEntry[];
  eTag: string | null;
};

function getManifestKey() {
  return process.env.AWS_S3_MEDIA_MANIFEST_KEY ?? "manifests/media-index.json";
}

function sortEntries(entries: MediaEntry[]) {
  return [...entries].sort((left, right) =>
    right.uploadedAt.localeCompare(left.uploadedAt)
  );
}

function normalizeETag(eTag?: string) {
  return eTag?.replaceAll('"', "") ?? null;
}

async function readManifestState(): Promise<ManifestState> {
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

    return {
      entries: sortEntries(parsed),
      eTag: normalizeETag(response.ETag),
    };
  } catch (error) {
    if (
      error instanceof NoSuchKey ||
      (error instanceof Error && error.name === "NoSuchKey")
    ) {
      return {
        entries: [],
        eTag: null,
      };
    }

    throw error;
  }
}

export async function readMediaEntries() {
  const state = await readManifestState();
  return state.entries;
}

async function putManifestWithCondition(state: ManifestState) {
  const config = getS3Config();
  const client = createS3Client();

  return client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: getManifestKey(),
      Body: `${JSON.stringify(sortEntries(state.entries), null, 2)}\n`,
      ContentType: "application/json",
      IfMatch: state.eTag ?? undefined,
      IfNoneMatch: state.eTag ? undefined : "*",
    })
  );
}

function isConditionalWriteConflict(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PreconditionFailed" ||
    error.name === "ConditionalRequestConflict" ||
    error.name === "Conflict"
  );
}

async function updateManifestWithRetry(
  updater: (entries: MediaEntry[]) => MediaEntry[],
  maxAttempts = 3
) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    const state = await readManifestState();
    const nextEntries = updater(state.entries);

    try {
      // Use the last observed ETag so concurrent writes fail fast and retry
      // against the latest manifest instead of silently overwriting it.
      await putManifestWithCondition({
        entries: nextEntries,
        eTag: state.eTag,
      });

      return sortEntries(nextEntries);
    } catch (error) {
      if (isConditionalWriteConflict(error) && attempt < maxAttempts) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("manifest-update-failed");
}

export async function createMediaEntry(input: CreateMediaEntryInput) {
  const entry: MediaEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uploadedAt: new Date().toISOString(),
    ...input,
  };

  await updateManifestWithRetry((entries) => [entry, ...entries]);

  return entry;
}

export async function getMediaEntryById(id: string) {
  const entries = await readMediaEntries();

  return entries.find((entry) => entry.id === id) ?? null;
}

export async function deleteMediaEntryById(id: string) {
  const config = getS3Config();
  const client = createS3Client();
  const entries = await readMediaEntries();
  const entry = entries.find((item) => item.id === id) ?? null;

  if (!entry) {
    return null;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: entry.bucket || config.bucket,
      Key: entry.objectKey,
    })
  );
  await updateManifestWithRetry((currentEntries) =>
    currentEntries.filter((item) => item.id !== id)
  );

  return entry;
}
