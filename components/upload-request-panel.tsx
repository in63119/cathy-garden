"use client";

import { ChangeEvent, startTransition, useState } from "react";

import { formatBytes, requestPresignedUpload } from "@/lib/upload-client";
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
  name: string;
  size: number;
  type: string;
};

export function UploadRequestPanel() {
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setErrorMessage(null);
      setPresignResult(null);
      return;
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    setErrorMessage(null);
    setPresignResult(null);
  };

  const handleRequestPresign = () => {
    if (!selectedFile) {
      setErrorMessage("Please choose a file first.");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setPresignResult(null);

    startTransition(() => {
      requestPresignedUpload({
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        size: selectedFile.size,
      })
        .then((result) => {
          setPresignResult({
            objectKey: result.objectKey,
            bucket: result.bucket,
            region: result.region,
            expiresIn: result.expiresIn,
          });
        })
        .catch((error: Error) => {
          setErrorMessage(errorMessages[error.message] ?? error.message);
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
        This first client flow stops after the server returns the presigned URL.
        The direct browser-to-S3 upload will be the next step.
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
        onClick={handleRequestPresign}
        disabled={isPending}
        style={{
          width: "fit-content",
          border: "none",
          cursor: isPending ? "progress" : "pointer",
        }}
      >
        {isPending ? "Requesting upload URL..." : "Request upload URL"}
      </button>

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
    </div>
  );
}
