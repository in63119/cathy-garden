const MB = 1024 * 1024;

export const MAX_UPLOAD_SIZE_BYTES = 250 * MB;
export const PRESIGNED_URL_EXPIRES_IN_SECONDS = 60 * 5;
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

const ALLOWED_MIME_TYPE_SET = new Set<string>(ALLOWED_UPLOAD_MIME_TYPES);

export type UploadRequestInput = {
  contentType?: string;
  fileName?: string;
  size?: number;
};

export function sanitizeFileName(fileName: string) {
  const normalized = fileName.trim().replace(/\s+/g, "-");
  const safe = normalized.replace(/[^A-Za-z0-9._-]/g, "");

  return safe.length > 0 ? safe : "upload";
}

export function buildUploadObjectKey(fileName: string, now = new Date()) {
  const safeFileName = sanitizeFileName(fileName);
  const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, "/");
  const uniqueSuffix = `${now.getTime()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  return `uploads/${datePrefix}/${uniqueSuffix}-${safeFileName}`;
}

export function validateUploadRequest(input: UploadRequestInput) {
  const fileName = input.fileName?.trim() ?? "";
  const contentType = input.contentType?.trim() ?? "";
  const size = input.size;

  if (!fileName) {
    return { ok: false as const, reason: "missing-file-name" };
  }

  if (!contentType) {
    return { ok: false as const, reason: "missing-content-type" };
  }

  if (!ALLOWED_MIME_TYPE_SET.has(contentType)) {
    return { ok: false as const, reason: "unsupported-content-type" };
  }

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return { ok: false as const, reason: "invalid-size" };
  }

  if (size > MAX_UPLOAD_SIZE_BYTES) {
    return { ok: false as const, reason: "file-too-large" };
  }

  return {
    ok: true as const,
    normalized: {
      fileName,
      contentType,
      size,
    },
  };
}
