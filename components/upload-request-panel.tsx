"use client";

import { ChangeEvent, startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import {
  completeUploadedMedia,
  formatBytes,
  requestPresignedUpload,
  uploadFileToPresignedUrl,
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
    "This file type is not allowed in the current upload policy.",
  "invalid-size": "The selected file size is invalid.",
  "file-too-large": "This file is larger than the current upload limit.",
  "invalid-json": "The upload request payload was malformed.",
  "presign-failed": "The server could not prepare an S3 upload URL.",
};

type SelectedFileState = {
  file: File;
  name: string;
  size: number;
  type: string;
};

export function UploadRequestPanel() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<SelectedFileState | null>(
    null
  );
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [presignResult, setPresignResult] = useState<{
    objectKey: string;
    bucket: string;
    region: string;
    expiresIn: number;
  } | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    id: string;
    objectKey: string;
    bucket: string;
    fileName: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setErrorMessage(null);
      setPresignResult(null);
      return;
    }

    setSelectedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    });
    setErrorMessage(null);
    setPresignResult(null);
    setUploadResult(null);
    setStatusMessage(null);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setErrorMessage("Please choose a file first.");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setPresignResult(null);
    setUploadResult(null);
    setStatusMessage("Preparing an upload URL...");

    startTransition(() => {
      requestPresignedUpload({
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        size: selectedFile.size,
      })
        .then(async (result) => {
          setPresignResult({
            objectKey: result.objectKey,
            bucket: result.bucket,
            region: result.region,
            expiresIn: result.expiresIn,
          });
          setStatusMessage("Uploading the file directly to S3...");

          await uploadFileToPresignedUrl({
            uploadUrl: result.uploadUrl,
            file: selectedFile.file,
            contentType: selectedFile.type,
          });

          setStatusMessage("Saving media metadata into the archive...");

          const entry = await completeUploadedMedia({
            objectKey: result.objectKey,
            bucket: result.bucket,
            region: result.region,
            fileName: result.fileName,
            contentType: result.contentType,
            size: result.size,
          });

          setUploadResult({
            id: entry.id,
            objectKey: entry.objectKey,
            bucket: entry.bucket,
            fileName: entry.fileName,
          });
          setStatusMessage("Upload completed successfully.");
          router.refresh();
        })
        .catch((error: Error) => {
          setErrorMessage(errorMessages[error.message] ?? error.message);
          setStatusMessage(null);
        })
        .finally(() => {
          setIsPending(false);
        });
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gap: "16px",
        borderRadius: "24px",
        padding: "20px",
        border: "1px dashed var(--border)",
        background: "rgba(255,255,255,0.45)",
      }}
    >
      <strong>Request a presigned S3 upload URL</strong>
      <span style={{ color: "var(--muted)", lineHeight: 1.7 }}>
        This flow now requests a presigned URL and immediately uploads the
        selected file directly from the browser to S3.
      </span>

      <div style={{ display: "grid", gap: "10px" }}>
        <label htmlFor="upload-file" style={{ fontWeight: 700 }}>
          Choose a photo or video
        </label>
        <input
          id="upload-file"
          type="file"
          accept={ALLOWED_UPLOAD_MIME_TYPES.join(",")}
          onChange={handleFileChange}
        />
      </div>

      {selectedFile ? (
        <div
          style={{
            display: "grid",
            gap: "4px",
            color: "var(--muted)",
            lineHeight: 1.6,
          }}
        >
          <span>
            File: <strong>{selectedFile.name}</strong>
          </span>
          <span>Type: {selectedFile.type || "unknown"}</span>
          <span>Size: {formatBytes(selectedFile.size)}</span>
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
          API route: <code>/api/upload/presign</code>
        </span>
        <span>
          Allowed types: <code>{ALLOWED_UPLOAD_MIME_TYPES.join(", ")}</code>
        </span>
        <span>
          Max file size:{" "}
          <code>{Math.floor(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))} MB</code>
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
        {isPending ? "Uploading to S3..." : "Upload to S3"}
      </button>

      {statusMessage ? (
        <p style={{ margin: 0, color: "var(--muted)", fontWeight: 700 }}>
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          style={{ margin: 0, color: "#7f3a2e", fontWeight: 700 }}
        >
          {errorMessage}
        </p>
      ) : null}

      {presignResult ? (
        <div
          style={{
            display: "grid",
            gap: "6px",
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.72)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            lineHeight: 1.6,
          }}
        >
          <strong>Presigned URL prepared</strong>
          <span>
            Object key: <code>{presignResult.objectKey}</code>
          </span>
          <span>
            Bucket: <code>{presignResult.bucket}</code>
          </span>
          <span>
            Region: <code>{presignResult.region}</code>
          </span>
          <span>
            Expires in: <code>{presignResult.expiresIn}</code> seconds
          </span>
        </div>
      ) : null}

      {uploadResult ? (
        <div
          style={{
            display: "grid",
            gap: "6px",
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(240, 248, 236, 0.92)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            lineHeight: 1.6,
          }}
        >
          <strong>File uploaded to S3</strong>
          <span>
            Saved as: <code>{uploadResult.fileName}</code>
          </span>
          <span>
            Bucket: <code>{uploadResult.bucket}</code>
          </span>
          <span>
            Object key: <code>{uploadResult.objectKey}</code>
          </span>
        </div>
      ) : null}
    </div>
  );
}
