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
