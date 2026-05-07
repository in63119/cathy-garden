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

export type UploadBatchItem = {
  file: File | Blob;
  fileName: string;
  contentType: string;
  size: number;
};

export type UploadBatchStage = "presign" | "transfer" | "complete";
export type UploadProgressCallback = (progress: {
  loaded: number;
  total: number;
  percentage: number;
}) => void;

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
  onProgress?: UploadProgressCallback;
}) {
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("PUT", params.uploadUrl);
    request.setRequestHeader("Content-Type", params.contentType);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      params.onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percentage: Math.min(
          100,
          Math.round((event.loaded / Math.max(event.total, 1)) * 100)
        ),
      });
    };

    request.onerror = () => {
      reject(new Error("s3-upload-failed"));
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        params.onProgress?.({
          loaded: params.file.size ?? 0,
          total: params.file.size ?? 0,
          percentage: 100,
        });
        resolve();
        return;
      }

      reject(new Error("s3-upload-failed"));
    };

    request.send(params.file);
  });
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

export async function uploadMediaBatch(
  items: UploadBatchItem[],
  options?: {
    onStageChange?: (params: {
      index: number;
      total: number;
      fileName: string;
      stage: UploadBatchStage;
    }) => void;
    onPresigned?: (params: {
      index: number;
      total: number;
      fileName: string;
      result: PresignUploadResponse;
    }) => void;
    onTransferProgress?: (params: {
      index: number;
      total: number;
      fileName: string;
      loaded: number;
      size: number;
      percentage: number;
    }) => void;
  }
) {
  const uploadedEntries: MediaEntryResponse[] = [];

  for (const [index, item] of items.entries()) {
    const batchIndex = index + 1;

    options?.onStageChange?.({
      index: batchIndex,
      total: items.length,
      fileName: item.fileName,
      stage: "presign",
    });

    const presigned = await requestPresignedUpload({
      fileName: item.fileName,
      contentType: item.contentType,
      size: item.size,
    });

    options?.onPresigned?.({
      index: batchIndex,
      total: items.length,
      fileName: item.fileName,
      result: presigned,
    });

    options?.onStageChange?.({
      index: batchIndex,
      total: items.length,
      fileName: item.fileName,
      stage: "transfer",
    });

    await uploadFileToPresignedUrl({
      uploadUrl: presigned.uploadUrl,
      file: item.file,
      contentType: item.contentType,
      onProgress: (progress) => {
        options?.onTransferProgress?.({
          index: batchIndex,
          total: items.length,
          fileName: item.fileName,
          loaded: progress.loaded,
          size: progress.total,
          percentage: progress.percentage,
        });
      },
    });

    options?.onStageChange?.({
      index: batchIndex,
      total: items.length,
      fileName: item.fileName,
      stage: "complete",
    });

    const entry = await completeUploadedMedia({
      objectKey: presigned.objectKey,
      bucket: presigned.bucket,
      region: presigned.region,
      fileName: presigned.fileName,
      contentType: presigned.contentType,
      size: presigned.size,
    });

    uploadedEntries.push(entry);
  }

  return uploadedEntries;
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
