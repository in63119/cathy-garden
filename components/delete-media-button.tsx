"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeleteMediaButtonProps = {
  mediaId: string;
  mode?: "refresh" | "redirect";
};

const errorMessages: Record<string, string> = {
  unauthorized: "Your session is not authorized anymore. Please log in again.",
  "not-found": "This media entry was not found in the archive.",
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
      "Delete this item from the archive?"
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
        {isPending ? "Deleting..." : "Delete"}
      </button>

      {errorMessage ? (
        <p role="alert" className="error-text">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
