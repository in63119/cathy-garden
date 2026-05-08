"use client";

import { ChangeEvent, startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  formatBytes,
  uploadMediaBatch,
} from "@/lib/upload-client";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/upload-policy";

const errorMessages: Record<string, string> = {
  unauthorized: "Your session is not authorized. Please log in again.",
  "missing-file-name": "Please choose a file with a valid name.",
  "missing-content-type": "The selected file is missing a content type.",
  "unsupported-content-type":
    "This file type is not allowed for this archive.",
  "invalid-size": "The selected file size is invalid.",
  "file-too-large": "This file is larger than the current upload limit.",
  "invalid-json": "The upload request payload was malformed.",
  "presign-failed": "The upload could not start. Please try again.",
  "duplicate-upload":
    "This file already appears to be in the archive. Rename it or delete the existing copy before uploading again.",
};

type SelectedFileState = {
  file: File;
  name: string;
  size: number;
  type: string;
  takenAt?: string;
};

type UploadProgressState = {
  currentFileName: string;
  currentIndex: number;
  totalFiles: number;
  percentage: number;
  loaded: number;
  totalBytes: number;
};

export function UploadRequestPanel() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileState[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<
    {
      id: string;
      objectKey: string;
      bucket: string;
      fileName: string;
    }[]
  >([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(
    null
  );

  useEffect(() => {
    if (uploadResults.length === 0) {
      return;
    }

    const lastUploaded = uploadResults[uploadResults.length - 1];
    const timeoutId = window.setTimeout(() => {
      router.push(
        `/library?uploaded=${encodeURIComponent(
          lastUploaded.fileName
        )}&uploadedCount=${uploadResults.length}`
      );
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, uploadResults]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      setSelectedFiles([]);
      setErrorMessage(null);
      setUploadProgress(null);
      return;
    }

    setSelectedFiles(
      files.map((file) => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        takenAt: getFileTakenAt(file),
      }))
    );
    setErrorMessage(null);
    setUploadResults([]);
    setStatusMessage(null);
    setUploadProgress(null);
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      setErrorMessage("Please choose at least one file first.");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setUploadResults([]);
    setStatusMessage("Preparing upload...");
    setUploadProgress(null);

    startTransition(() => {
      uploadMediaBatch(
        selectedFiles.map((selectedFile) => ({
          file: selectedFile.file,
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          size: selectedFile.size,
          takenAt: selectedFile.takenAt,
        })),
        {
          onStageChange: ({ index, total, fileName, stage }) => {
            if (stage === "presign") {
              setStatusMessage(`Preparing ${index} of ${total}: ${fileName}`);
              return;
            }

            if (stage === "transfer") {
              setStatusMessage(`Uploading ${index} of ${total}: ${fileName}`);
              setUploadProgress({
                currentFileName: fileName,
                currentIndex: index,
                totalFiles: total,
                percentage: 0,
                loaded: 0,
                totalBytes:
                  selectedFiles.find((selectedFile) => selectedFile.name === fileName)
                    ?.size ?? 0,
              });
              return;
            }

            setStatusMessage(`Saving ${index} of ${total}: ${fileName}`);
          },
          onTransferProgress: ({
            index,
            total,
            fileName,
            loaded,
            size,
            percentage,
          }) => {
            setUploadProgress({
              currentFileName: fileName,
              currentIndex: index,
              totalFiles: total,
              percentage,
              loaded,
              totalBytes: size,
            });
          },
          onTransferRetry: ({
            index,
            total,
            fileName,
            attempt,
            maxAttempts,
          }) => {
            setStatusMessage(
              `Upload failed. Retrying ${index} of ${total}: ${fileName} (${attempt}/${maxAttempts})`
            );
            setUploadProgress((currentProgress) =>
              currentProgress?.currentFileName === fileName
                ? {
                    ...currentProgress,
                    percentage: 0,
                    loaded: 0,
                  }
                : currentProgress
            );
          },
        }
      )
        .then((entries) => {
          setUploadResults(
            entries.map((entry) => ({
              id: entry.id,
              objectKey: entry.objectKey,
              bucket: entry.bucket,
              fileName: entry.fileName,
            }))
          );
          setStatusMessage(
            `${entries.length} upload${entries.length > 1 ? "s" : ""} completed successfully. Opening the library...`
          );
          setUploadProgress(null);
          router.refresh();
        })
        .catch((error: Error) => {
          setErrorMessage(errorMessages[error.message] ?? error.message);
          setStatusMessage(null);
          setUploadProgress(null);
        })
        .finally(() => {
          setIsPending(false);
        });
    });
  };

  return (
    <div className="panel panel-dashed">
      <strong>Choose photos and videos</strong>
      <span style={{ color: "var(--muted)", lineHeight: 1.7 }}>
        Select one or more files from your phone or computer. The archive will
        open when the upload is done.
      </span>

      <div style={{ display: "grid", gap: "10px" }}>
        <label htmlFor="upload-file" style={{ fontWeight: 700 }}>
          Choose one or more photos and videos
        </label>
        <input
          id="upload-file"
          type="file"
          className="input-field"
          multiple
          accept={ALLOWED_UPLOAD_MIME_TYPES.join(",")}
          onChange={handleFileChange}
        />
      </div>

      {selectedFiles.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: "8px",
            color: "var(--muted)",
            lineHeight: 1.6,
          }}
        >
          <strong>
            {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
          </strong>
          <div style={{ display: "grid", gap: "4px" }}>
            {selectedFiles.map((selectedFile) => (
              <span key={`${selectedFile.name}-${selectedFile.size}`}>
                <strong>{selectedFile.name}</strong>
                {" · "}
                {formatBytes(selectedFile.size)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "6px",
          color: "var(--muted)",
          fontSize: "0.95rem",
          lineHeight: 1.6,
        }}
      >
        <span>
          Photos and videos only.
        </span>
        <span>
          Up to{" "}
          <code>{Math.floor(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))} MB</code>
          {" "}per file.
        </span>
        <span>
          Multiple files can be selected at once.
        </span>
      </div>

      <button
        type="button"
        className="button-link primary"
        onClick={handleUpload}
        disabled={isPending}
        style={{
          width: "fit-content",
          border: "none",
          cursor: isPending ? "progress" : "pointer",
        }}
      >
        {isPending ? "Uploading..." : "Upload selected files"}
      </button>

      {statusMessage ? (
        <p className="status-text">{statusMessage}</p>
      ) : null}

      {uploadProgress ? (
        <div className="card-soft" style={{ display: "grid", gap: "10px", padding: "16px" }}>
          <strong>
            Uploading {uploadProgress.currentIndex} of {uploadProgress.totalFiles}:{" "}
            {uploadProgress.currentFileName}
          </strong>
          <div
            aria-label="Upload progress"
            style={{
              width: "100%",
              height: "12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.82)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${uploadProgress.percentage}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, var(--accent) 0%, var(--accent-strong) 100%)",
              }}
            />
          </div>
          <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            {uploadProgress.percentage}% · {formatBytes(uploadProgress.loaded)} of{" "}
            {formatBytes(uploadProgress.totalBytes)}
          </span>
        </div>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="error-text">
          {errorMessage}
        </p>
      ) : null}

      {uploadResults.length > 0 ? (
        <div className="card-soft panel-success" style={{ display: "grid", gap: "6px", padding: "16px", lineHeight: 1.6 }}>
          <strong>
            {uploadResults.length} file{uploadResults.length > 1 ? "s" : ""} added to the archive
          </strong>
          <span>
            The library will open automatically in a moment.
          </span>
          <div style={{ display: "grid", gap: "4px" }}>
            {uploadResults.map((uploadResult) => (
              <span key={uploadResult.id}>
                Saved as: <code>{uploadResult.fileName}</code>
              </span>
            ))}
          </div>
          <button
            type="button"
            className="button-link secondary"
            onClick={() =>
              router.push(
                `/library?uploaded=${encodeURIComponent(
                  uploadResults[uploadResults.length - 1]?.fileName ?? ""
                )}&uploadedCount=${uploadResults.length}`
              )
            }
            style={{ width: "fit-content", cursor: "pointer" }}
          >
            Open library now
          </button>
        </div>
      ) : null}
    </div>
  );
}

function getFileTakenAt(file: File) {
  if (!Number.isFinite(file.lastModified) || file.lastModified <= 0) {
    return undefined;
  }

  return new Date(file.lastModified).toISOString();
}
