import { promises as fs } from "fs";
import path from "path";

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

const MEDIA_INDEX_PATH = path.join(
  process.cwd(),
  "data",
  "media-index.json"
);

async function ensureMediaIndexFile() {
  await fs.mkdir(path.dirname(MEDIA_INDEX_PATH), { recursive: true });

  try {
    await fs.access(MEDIA_INDEX_PATH);
  } catch {
    await fs.writeFile(MEDIA_INDEX_PATH, "[]\n", "utf8");
  }
}

export async function readMediaEntries() {
  await ensureMediaIndexFile();
  const raw = await fs.readFile(MEDIA_INDEX_PATH, "utf8");
  const parsed = JSON.parse(raw) as MediaEntry[];

  return parsed.sort((left, right) =>
    right.uploadedAt.localeCompare(left.uploadedAt)
  );
}

export async function createMediaEntry(input: CreateMediaEntryInput) {
  const entries = await readMediaEntries();
  const entry: MediaEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uploadedAt: new Date().toISOString(),
    ...input,
  };

  await fs.writeFile(
    MEDIA_INDEX_PATH,
    `${JSON.stringify([entry, ...entries], null, 2)}\n`,
    "utf8"
  );

  return entry;
}
