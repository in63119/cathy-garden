import { SectionCard } from "@/components/section-card";

export default function UploadPage() {
  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Upload"
        title="A dedicated route for photo and video upload."
        description="The real upload flow will issue presigned S3 URLs, show upload progress, and persist media metadata after completion."
      >
        <div
          style={{
            display: "grid",
            gap: "12px",
            borderRadius: "24px",
            padding: "20px",
            border: "1px dashed var(--border)",
            background: "rgba(255,255,255,0.45)",
          }}
        >
          <strong>Upload flow skeleton</strong>
          <span style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Select files, request an S3 upload URL, upload directly to storage,
            and store metadata back in the application.
          </span>
          <button
            type="button"
            className="button-link secondary"
            style={{ width: "fit-content" }}
            disabled
          >
            File picker coming soon
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
