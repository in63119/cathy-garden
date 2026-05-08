"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ShareMediaPanelProps = {
  mediaId: string;
  shareToken?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Your session is not authorized anymore. Please log in again.",
  "not-found": "This media entry was not found in the archive.",
  "invalid-share": "The share request was invalid.",
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
      <strong>Share link</strong>
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
            {isPending ? "Saving..." : "Disable share link"}
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
          {isPending ? "Saving..." : "Create share link"}
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
