export type CompleteUploadPayload = {
  objectKey?: string;
  bucket?: string;
  region?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
};

export function validateCompleteUploadPayload(payload: CompleteUploadPayload) {
  const objectKey = payload.objectKey?.trim() ?? "";
  const bucket = payload.bucket?.trim() ?? "";
  const region = payload.region?.trim() ?? "";
  const fileName = payload.fileName?.trim() ?? "";
  const contentType = payload.contentType?.trim() ?? "";
  const size = payload.size;

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

  return {
    ok: true as const,
    normalized: {
      objectKey,
      bucket,
      region,
      fileName,
      contentType,
      size,
    },
  };
}
