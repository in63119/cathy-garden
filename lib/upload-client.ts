export type PresignRequestPayload = {
  fileName: string;
  contentType: string;
  size: number;
};

export type PresignUploadResponse = {
  uploadUrl: string;
  objectKey: string;
  bucket: string;
  region: string;
  expiresIn: number;
  contentType: string;
  fileName: string;
  size: number;
};

export type MediaEntryResponse = {
  id: string;
  objectKey: string;
  bucket: string;
  region: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

export async function requestPresignedUpload(
  payload: PresignRequestPayload
): Promise<PresignUploadResponse> {
  const response = await fetch("/api/upload/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "presign-failed");
  }

  return data as PresignUploadResponse;
}

export async function uploadFileToPresignedUrl(params: {
  uploadUrl: string;
  file: File | Blob;
  contentType: string;
}) {
  const response = await fetch(params.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": params.contentType,
    },
    body: params.file,
  });

  if (!response.ok) {
    throw new Error("s3-upload-failed");
  }
}

export async function completeUploadedMedia(
  payload: Omit<MediaEntryResponse, "id" | "uploadedAt">
) {
  const response = await fetch("/api/media/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "complete-upload-failed");
  }

  return data.entry as MediaEntryResponse;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
