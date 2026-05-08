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
  unauthorized: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  "missing-file-name": "이름이 있는 파일을 선택해 주세요.",
  "missing-content-type": "선택한 파일의 형식을 확인할 수 없습니다.",
  "unsupported-content-type":
    "이 보관함에 올릴 수 없는 파일 형식입니다.",
  "invalid-size": "선택한 파일 크기가 올바르지 않습니다.",
  "file-too-large": "현재 업로드 제한보다 큰 파일입니다.",
  "invalid-json": "업로드 요청을 처리하지 못했습니다.",
  "presign-failed": "업로드를 시작하지 못했습니다. 다시 시도해 주세요.",
  "duplicate-upload":
    "이미 보관함에 있는 파일로 보입니다. 기존 파일을 삭제하거나 파일 이름을 바꾼 뒤 다시 올려 주세요.",
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
  const selectedFilesTotalSize = selectedFiles.reduce(
    (totalSize, selectedFile) => totalSize + selectedFile.size,
    0
  );
  const visibleSelectedFiles = selectedFiles.slice(0, 3);
  const hiddenSelectedFileCount = Math.max(
    selectedFiles.length - visibleSelectedFiles.length,
    0
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
      setErrorMessage("먼저 파일을 하나 이상 선택해 주세요.");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setUploadResults([]);
    setStatusMessage("업로드를 준비하는 중입니다...");
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
              setStatusMessage(`${total}개 중 ${index}번째 준비 중: ${fileName}`);
              return;
            }

            if (stage === "transfer") {
              setStatusMessage(`${total}개 중 ${index}번째 업로드 중: ${fileName}`);
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

            setStatusMessage(`${total}개 중 ${index}번째 저장 중: ${fileName}`);
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
              `업로드에 실패해 다시 시도합니다. ${total}개 중 ${index}번째: ${fileName} (${attempt}/${maxAttempts})`
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
            `${entries.length}개 파일 업로드가 완료되었습니다. 보관함을 여는 중입니다...`
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
      <strong>사진과 영상 선택</strong>
      <span style={{ color: "var(--muted)", lineHeight: 1.7 }}>
        휴대폰이나 컴퓨터에서 파일을 하나 이상 선택하세요. 업로드가 끝나면
        보관함이 자동으로 열립니다.
      </span>

      <div style={{ display: "grid", gap: "10px" }}>
        <label htmlFor="upload-file" style={{ fontWeight: 700 }}>
          올릴 사진과 영상
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
        <div className="upload-selection-summary">
          <div className="upload-selection-header">
            <strong>{selectedFiles.length}개 파일 선택됨</strong>
            <span>{formatBytes(selectedFilesTotalSize)}</span>
          </div>
          <div className="upload-file-list">
            {visibleSelectedFiles.map((selectedFile) => (
              <span
                key={`${selectedFile.name}-${selectedFile.size}`}
                className="upload-file-row"
              >
                <strong title={selectedFile.name}>{selectedFile.name}</strong>
                <span>{formatBytes(selectedFile.size)}</span>
              </span>
            ))}
            {hiddenSelectedFileCount > 0 ? (
              <span className="upload-file-row upload-file-row-muted">
                <strong>외 {hiddenSelectedFileCount}개 파일</strong>
                <span>선택됨</span>
              </span>
            ) : null}
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
          사진과 영상만 올릴 수 있습니다.
        </span>
        <span>
          파일 하나당 최대{" "}
          <code>{Math.floor(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))} MB</code>
          까지 가능합니다.
        </span>
        <span>
          여러 파일을 한 번에 선택할 수 있습니다.
        </span>
      </div>

      <div className="upload-action-row">
        <button
          type="button"
          className="button-link primary"
          onClick={handleUpload}
          disabled={isPending || selectedFiles.length === 0}
          style={{
            border: "none",
            cursor:
              isPending
                ? "progress"
                : selectedFiles.length === 0
                  ? "not-allowed"
                  : "pointer",
          }}
        >
          {isPending ? "올리는 중..." : "선택한 파일 올리기"}
        </button>
      </div>

      {statusMessage ? (
        <p className="status-text">{statusMessage}</p>
      ) : null}

      {uploadProgress ? (
        <div className="card-soft upload-progress-card">
          <strong className="upload-progress-title">
            {uploadProgress.totalFiles}개 중 {uploadProgress.currentIndex}번째 업로드 중:{" "}
            {uploadProgress.currentFileName}
          </strong>
          <div
            aria-label="업로드 진행률"
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
            {uploadProgress.percentage}% · {formatBytes(uploadProgress.loaded)} /{" "}
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
            {uploadResults.length}개 파일이 보관함에 추가되었습니다
          </strong>
          <span>
            잠시 후 보관함이 자동으로 열립니다.
          </span>
          <div style={{ display: "grid", gap: "4px" }}>
            {uploadResults.map((uploadResult) => (
              <span key={uploadResult.id} className="upload-result-row">
                저장됨: <code>{uploadResult.fileName}</code>
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
            지금 보관함 열기
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
