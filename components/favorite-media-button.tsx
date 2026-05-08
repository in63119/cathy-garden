"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type FavoriteMediaButtonProps = {
  mediaId: string;
  favorite?: boolean;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Your session is not authorized anymore. Please log in again.",
  "not-found": "This media entry was not found in the archive.",
  "invalid-favorite": "The favorite request was invalid.",
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
          ? "Saving..."
          : favorite
            ? "Remove favorite"
            : "Add favorite"}
      </button>

      {errorMessage ? (
        <p role="alert" className="error-text">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
