"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  normalizeMediaTag,
  normalizeMediaTags,
} from "@/lib/media-preview";

type MediaTagsPanelProps = {
  mediaId: string;
  tags?: string[];
};

const errorMessages: Record<string, string> = {
  unauthorized: "Your session is not authorized anymore. Please log in again.",
  "not-found": "This media entry was not found in the archive.",
  "invalid-tags": "The tag request was invalid.",
};

export function MediaTagsPanel({ mediaId, tags = [] }: MediaTagsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftTag, setDraftTag] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const normalizedTags = normalizeMediaTags(tags);

  const saveTags = (nextTags: string[]) => {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tags: normalizeMediaTags(nextTags),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          errorMessages[data?.error] ?? data?.error ?? "tags-failed"
        );
        return;
      }

      setDraftTag("");
      router.refresh();
    });
  };

  const handleAddTag = () => {
    const nextTag = normalizeMediaTag(draftTag);

    if (!nextTag) {
      return;
    }

    saveTags([...normalizedTags, nextTag]);
  };

  return (
    <div className="card-soft" style={{ display: "grid", gap: "12px", padding: "16px" }}>
      <strong>Tags</strong>
      {normalizedTags.length > 0 ? (
        <div className="media-detail-chips">
          {normalizedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="media-chip"
              onClick={() =>
                saveTags(normalizedTags.filter((currentTag) => currentTag !== tag))
              }
              disabled={isPending}
              title={`Remove ${tag}`}
              style={{ cursor: isPending ? "progress" : "pointer" }}
            >
              {tag} x
            </button>
          ))}
        </div>
      ) : (
        <span style={{ color: "var(--muted)" }}>No tags yet.</span>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <input
          type="text"
          className="input-field"
          value={draftTag}
          onChange={(event) => setDraftTag(event.target.value)}
          placeholder="Add a tag"
          maxLength={32}
          style={{ maxWidth: "260px" }}
        />
        <button
          type="button"
          className="button-link secondary"
          onClick={handleAddTag}
          disabled={isPending}
          style={{ cursor: isPending ? "progress" : "pointer" }}
        >
          {isPending ? "Saving..." : "Add tag"}
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
