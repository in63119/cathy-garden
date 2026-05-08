"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeleteMediaButtonProps = {
  mediaId: string;
  mode?: "refresh" | "redirect";
};

const errorMessages: Record<string, string> = {
  unauthorized: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  "not-found": "보관함에서 이 항목을 찾을 수 없습니다.",
};

export function DeleteMediaButton({
  mediaId,
  mode = "refresh",
}: DeleteMediaButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = () => {
    const confirmed = window.confirm(
      "이 항목을 보관함에서 삭제할까요?"
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(errorMessages[data?.error] ?? data?.error ?? "delete-failed");
        return;
      }

      if (mode === "redirect") {
        router.push("/library");
        router.refresh();
        return;
      }

      router.refresh();
    });
  };

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <button
        type="button"
        className="button-link danger"
        onClick={handleDelete}
        disabled={isPending}
        style={{
          width: "fit-content",
          cursor: isPending ? "progress" : "pointer",
        }}
      >
        {isPending ? "삭제 중..." : "삭제"}
      </button>

      {errorMessage ? (
        <p role="alert" className="error-text">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
