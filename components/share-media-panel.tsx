"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ShareMediaPanelProps = {
  mediaId: string;
  shareToken?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  "not-found": "보관함에서 이 항목을 찾을 수 없습니다.",
  "invalid-share": "공유 요청이 올바르지 않습니다.",
};

export function ShareMediaPanel({ mediaId, shareToken }: ShareMediaPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const shareUrl = useMemo(() => {
    if (!shareToken || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/share/${shareToken}`;
  }, [shareToken]);

  const updateSharing = (shareEnabled: boolean) => {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareEnabled,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          errorMessages[data?.error] ?? data?.error ?? "share-failed"
        );
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="card-soft" style={{ display: "grid", gap: "12px", padding: "16px" }}>
      <strong>공유 링크</strong>
      {shareToken ? (
        <>
          <input
            className="input-field"
            readOnly
            value={shareUrl || `/share/${shareToken}`}
          />
          <button
            type="button"
            className="button-link danger"
            onClick={() => updateSharing(false)}
            disabled={isPending}
            style={{ width: "fit-content", cursor: isPending ? "progress" : "pointer" }}
          >
            {isPending ? "저장 중..." : "공유 링크 끄기"}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="button-link secondary"
          onClick={() => updateSharing(true)}
          disabled={isPending}
          style={{ width: "fit-content", cursor: isPending ? "progress" : "pointer" }}
        >
          {isPending ? "저장 중..." : "공유 링크 만들기"}
        </button>
      )}

      {errorMessage ? (
        <p role="alert" className="error-text">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
