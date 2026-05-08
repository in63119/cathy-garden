"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  normalizeMediaAlbum,
  normalizeMediaAlbums,
} from "@/lib/media-preview";

type MediaAlbumsPanelProps = {
  albums?: string[];
  mediaId: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Your session is not authorized anymore. Please log in again.",
  "not-found": "This media entry was not found in the archive.",
  "invalid-albums": "The album request was invalid.",
};

export function MediaAlbumsPanel({
  albums = [],
  mediaId,
}: MediaAlbumsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftAlbum, setDraftAlbum] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const normalizedAlbums = normalizeMediaAlbums(albums);

  const saveAlbums = (nextAlbums: string[]) => {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          albums: normalizeMediaAlbums(nextAlbums),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          errorMessages[data?.error] ?? data?.error ?? "albums-failed"
        );
        return;
      }

      setDraftAlbum("");
      router.refresh();
    });
  };

  const handleAddAlbum = () => {
    const nextAlbum = normalizeMediaAlbum(draftAlbum);

    if (!nextAlbum) {
      return;
    }

    saveAlbums([...normalizedAlbums, nextAlbum]);
  };

  return (
    <div className="card-soft" style={{ display: "grid", gap: "12px", padding: "16px" }}>
      <strong>Albums</strong>
      {normalizedAlbums.length > 0 ? (
        <div className="media-detail-chips">
          {normalizedAlbums.map((album) => (
            <button
              key={album}
              type="button"
              className="media-chip"
              onClick={() =>
                saveAlbums(
                  normalizedAlbums.filter((currentAlbum) => currentAlbum !== album)
                )
              }
              disabled={isPending}
              title={`Remove ${album}`}
              style={{ cursor: isPending ? "progress" : "pointer" }}
            >
              {album} x
            </button>
          ))}
        </div>
      ) : (
        <span style={{ color: "var(--muted)" }}>No albums yet.</span>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <input
          type="text"
          className="input-field"
          value={draftAlbum}
          onChange={(event) => setDraftAlbum(event.target.value)}
          placeholder="Add to album"
          maxLength={48}
          style={{ maxWidth: "260px" }}
        />
        <button
          type="button"
          className="button-link secondary"
          onClick={handleAddAlbum}
          disabled={isPending}
          style={{ cursor: isPending ? "progress" : "pointer" }}
        >
          {isPending ? "Saving..." : "Add album"}
        </button>
      </div>

      {errorMessage ? (
        <p role="alert" className="error-text">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
