import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createS3Client, getS3Config, streamToString } from "@/lib/s3";

export type ContestEntry = {
  id: string;
  title: string;
  deadline: string;
  prize: string;
  captureImageObjectKey: string;
  createdAt: string;
  updatedAt: string;
};

export type ContestInput = {
  title: string;
  deadline: string;
  prize: string;
  captureImageObjectKey: string;
};

const CONTEST_INDEX_OBJECT_KEY = "contests/index.json";

export function getContestIndexObjectKey() {
  return CONTEST_INDEX_OBJECT_KEY;
}

export function normalizeContestId(value: string) {
  const normalized = value.trim();

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    throw new Error("invalid-contest-id");
  }

  return normalized;
}

export function buildContestId(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `contest-${Date.now()}`;
}

function normalizeContestInput(input: ContestInput) {
  const title = input.title.trim();
  const deadline = input.deadline.trim();
  const prize = input.prize.trim();
  const captureImageObjectKey = input.captureImageObjectKey.trim();

  if (!title || !deadline || !prize || !captureImageObjectKey) {
    throw new Error("invalid-contest");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    throw new Error("invalid-contest-deadline");
  }

  if (!captureImageObjectKey.startsWith("contests/")) {
    throw new Error("invalid-contest-capture-key");
  }

  return {
    title: title.slice(0, 160),
    deadline,
    prize: prize.slice(0, 160),
    captureImageObjectKey: captureImageObjectKey.slice(0, 1024),
  };
}

function normalizeContestEntries(value: unknown): ContestEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is ContestEntry =>
        typeof entry?.id === "string" &&
        typeof entry.title === "string" &&
        typeof entry.deadline === "string" &&
        typeof entry.prize === "string" &&
        typeof entry.captureImageObjectKey === "string" &&
        typeof entry.createdAt === "string" &&
        typeof entry.updatedAt === "string",
    )
    .sort((left, right) => left.deadline.localeCompare(right.deadline));
}

async function writeContestEntries(entries: ContestEntry[]) {
  const config = getS3Config();
  const client = createS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: getContestIndexObjectKey(),
      Body: `${JSON.stringify(normalizeContestEntries(entries), null, 2)}\n`,
      ContentType: "application/json",
    }),
  );

  return normalizeContestEntries(entries);
}

export async function readContestEntries() {
  const config = getS3Config();
  const client = createS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: getContestIndexObjectKey(),
      }),
    );
    const body = response.Body ? await streamToString(response.Body) : "[]";

    return normalizeContestEntries(JSON.parse(body));
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

export async function createContestEntry(input: ContestInput) {
  const contests = await readContestEntries();
  const normalized = normalizeContestInput(input);
  let id = buildContestId(normalized.title);
  let suffix = 2;

  while (contests.some((contest) => contest.id === id)) {
    id = `${buildContestId(normalized.title)}-${suffix}`;
    suffix += 1;
  }

  const now = new Date().toISOString();
  const contest: ContestEntry = {
    id,
    ...normalized,
    createdAt: now,
    updatedAt: now,
  };

  await writeContestEntries([...contests, contest]);

  return contest;
}

export async function updateContestEntry(id: string, input: ContestInput) {
  const normalizedId = normalizeContestId(id);
  const contests = await readContestEntries();
  const existing = contests.find((contest) => contest.id === normalizedId);

  if (!existing) {
    return null;
  }

  const normalized = normalizeContestInput(input);
  const updatedContest: ContestEntry = {
    ...existing,
    ...normalized,
    updatedAt: new Date().toISOString(),
  };

  await writeContestEntries(
    contests.map((contest) =>
      contest.id === normalizedId ? updatedContest : contest,
    ),
  );

  return updatedContest;
}

export async function deleteContestEntry(id: string) {
  const normalizedId = normalizeContestId(id);
  const contests = await readContestEntries();
  const existing = contests.find((contest) => contest.id === normalizedId);

  if (!existing) {
    return null;
  }

  await writeContestEntries(
    contests.filter((contest) => contest.id !== normalizedId),
  );

  const config = getS3Config();
  const client = createS3Client();

  await Promise.allSettled([
    client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: `contests/${normalizedId}/idea-memo.json`,
      }),
    ),
    client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: `contests/${normalizedId}/submissions.json`,
      }),
    ),
  ]);

  return existing;
}
