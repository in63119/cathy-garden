import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createS3Client, getS3Config, streamToString } from "@/lib/s3";

export type ContestIdeaMemo = {
  contestId: string;
  memo: string;
  updatedAt: string | null;
};

export function buildContestIdeaMemoObjectKey(contestId: string) {
  const normalizedContestId = contestId.trim();

  if (!/^[a-z0-9-]+$/.test(normalizedContestId)) {
    throw new Error("invalid-contest-id");
  }

  return `contests/${normalizedContestId}/idea-memo.json`;
}

export async function readContestIdeaMemo(
  contestId: string,
): Promise<ContestIdeaMemo> {
  const config = getS3Config();
  const client = createS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: buildContestIdeaMemoObjectKey(contestId),
      }),
    );
    const body = response.Body ? await streamToString(response.Body) : "{}";
    const parsed = JSON.parse(body) as Partial<ContestIdeaMemo>;

    return {
      contestId,
      memo: typeof parsed.memo === "string" ? parsed.memo : "",
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
        memo: "",
        updatedAt: null,
      };
    }

    throw error;
  }
}

export async function writeContestIdeaMemo(params: {
  contestId: string;
  memo: string;
}) {
  const config = getS3Config();
  const client = createS3Client();
  const ideaMemo: ContestIdeaMemo = {
    contestId: params.contestId,
    memo: params.memo,
    updatedAt: new Date().toISOString(),
  };

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: buildContestIdeaMemoObjectKey(params.contestId),
      Body: `${JSON.stringify(ideaMemo, null, 2)}\n`,
      ContentType: "application/json",
    }),
  );

  return ideaMemo;
}
