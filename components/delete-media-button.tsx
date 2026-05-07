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
      "Delete this item from S3 and remove it from the library?"
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
        className="button-link secondary"
        onClick={handleDelete}
        disabled={isPending}
        style={{
          width: "fit-content",
          cursor: isPending ? "progress" : "pointer",
          borderColor: "rgba(127, 58, 46, 0.2)",
          color: "#7f3a2e",
        }}
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>

      {errorMessage ? (
        <p role="alert" style={{ margin: 0, color: "#7f3a2e", fontWeight: 700 }}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
