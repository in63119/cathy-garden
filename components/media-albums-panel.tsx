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
  unauthorized: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  "not-found": "보관함에서 이 항목을 찾을 수 없습니다.",
  "invalid-albums": "앨범 요청이 올바르지 않습니다.",
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
      <strong>앨범</strong>
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
              title={`${album} 앨범에서 제거`}
              style={{ cursor: isPending ? "progress" : "pointer" }}
            >
              {album} 삭제
            </button>
          ))}
        </div>
      ) : (
        <span style={{ color: "var(--muted)" }}>아직 앨범이 없습니다.</span>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <input
          type="text"
          className="input-field"
          value={draftAlbum}
          onChange={(event) => setDraftAlbum(event.target.value)}
          placeholder="앨범에 추가"
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
          {isPending ? "저장 중..." : "앨범 추가"}
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
