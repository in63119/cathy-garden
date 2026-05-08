"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type FavoriteMediaButtonProps = {
  mediaId: string;
  favorite?: boolean;
};

const errorMessages: Record<string, string> = {
  unauthorized: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  "not-found": "보관함에서 이 항목을 찾을 수 없습니다.",
  "invalid-favorite": "즐겨찾기 요청이 올바르지 않습니다.",
};

export function FavoriteMediaButton({
  mediaId,
  favorite = false,
}: FavoriteMediaButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextFavorite = !favorite;

  const handleToggle = () => {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          favorite: nextFavorite,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          errorMessages[data?.error] ?? data?.error ?? "favorite-failed"
        );
        return;
      }

      router.refresh();
    });
  };

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <button
        type="button"
        className={`button-link secondary${favorite ? " is-active" : ""}`}
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={favorite}
        style={{
          width: "fit-content",
          cursor: isPending ? "progress" : "pointer",
        }}
      >
        {isPending
          ? "저장 중..."
          : favorite
            ? "즐겨찾기 해제"
            : "즐겨찾기 추가"}
      </button>

      {errorMessage ? (
        <p role="alert" className="error-text">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
