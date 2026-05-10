import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createS3Client, getS3Config, streamToString } from "@/lib/s3";

export type ContestSubmission = {
  id: string;
  name: string;
  type: "file" | "youtube";
  objectKey: string;
  url: string;
  submittedAt: string;
};

export type ContestSubmissionArchive = {
  contestId: string;
  submissions: ContestSubmission[];
  updatedAt: string | null;
};

export function buildContestSubmissionsObjectKey(contestId: string) {
  const normalizedContestId = contestId.trim();

  if (!/^[a-z0-9-]+$/.test(normalizedContestId)) {
    throw new Error("invalid-contest-id");
  }

  return `contests/${normalizedContestId}/submissions.json`;
}

function normalizeSubmissions(value: unknown): ContestSubmission[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is ContestSubmission =>
      typeof entry?.id === "string" &&
      typeof entry.name === "string" &&
      typeof entry.objectKey === "string" &&
      typeof entry.submittedAt === "string",
    )
    .map((entry) => ({
      ...entry,
      type: entry.type === "youtube" ? "youtube" : "file",
      url: typeof entry.url === "string" ? entry.url : "",
    }));
}

export async function readContestSubmissionArchive(
  contestId: string,
): Promise<ContestSubmissionArchive> {
  const config = getS3Config();
  const client = createS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: buildContestSubmissionsObjectKey(contestId),
      }),
    );
    const body = response.Body ? await streamToString(response.Body) : "{}";
    const parsed = JSON.parse(body) as Partial<ContestSubmissionArchive>;

    return {
      contestId,
      submissions: normalizeSubmissions(parsed.submissions),
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    };
  } catch (error) {
    if (
      error instanceof NoSuchKey ||
      (error instanceof Error && error.name === "NoSuchKey")
    ) {
      return {
        contestId,
        submissions: [],
        updatedAt: null,
      };
    }

    throw error;
  }
}

async function writeContestSubmissionArchive(
  archive: ContestSubmissionArchive,
) {
  const config = getS3Config();
  const client = createS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: buildContestSubmissionsObjectKey(archive.contestId),
      Body: `${JSON.stringify(archive, null, 2)}\n`,
      ContentType: "application/json",
    }),
  );

  return archive;
}

export async function addContestSubmission(params: {
  contestId: string;
  name: string;
  type: "file" | "youtube";
  objectKey?: string;
  url?: string;
}) {
  const archive = await readContestSubmissionArchive(params.contestId);
  const submittedAt = new Date().toISOString();
  const submission: ContestSubmission = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: params.name,
    type: params.type,
    objectKey: params.objectKey ?? "",
    url: params.url ?? "",
    submittedAt,
  };

  return writeContestSubmissionArchive({
    contestId: params.contestId,
    submissions: [submission, ...archive.submissions],
    updatedAt: submittedAt,
  });
}
