export type CompleteUploadPayload = {
  objectKey?: string;
  bucket?: string;
  region?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  takenAt?: string;
  thumbnailObjectKey?: string;
};

export function validateCompleteUploadPayload(payload: CompleteUploadPayload) {
  const objectKey = payload.objectKey?.trim() ?? "";
  const bucket = payload.bucket?.trim() ?? "";
  const region = payload.region?.trim() ?? "";
  const fileName = payload.fileName?.trim() ?? "";
  const contentType = payload.contentType?.trim() ?? "";
  const size = payload.size;
  const takenAt = payload.takenAt?.trim() ?? undefined;
  const thumbnailObjectKey = payload.thumbnailObjectKey?.trim() ?? undefined;

  if (!objectKey) {
    return { ok: false as const, reason: "missing-object-key" };
  }

  if (!bucket) {
    return { ok: false as const, reason: "missing-bucket" };
  }

  if (!region) {
    return { ok: false as const, reason: "missing-region" };
  }

  if (!fileName) {
    return { ok: false as const, reason: "missing-file-name" };
  }

  if (!contentType) {
    return { ok: false as const, reason: "missing-content-type" };
  }

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return { ok: false as const, reason: "invalid-size" };
  }

  if (takenAt && Number.isNaN(Date.parse(takenAt))) {
    return { ok: false as const, reason: "invalid-taken-at" };
  }

  if (thumbnailObjectKey && !thumbnailObjectKey.startsWith("thumbnails/")) {
    return { ok: false as const, reason: "invalid-thumbnail-key" };
  }

  return {
    ok: true as const,
    normalized: {
      objectKey,
      bucket,
      region,
      fileName,
      contentType,
      size,
      takenAt,
      thumbnailObjectKey,
    },
  };
}
