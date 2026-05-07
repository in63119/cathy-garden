import { UploadRequestPanel } from "@/components/upload-request-panel";
import { SectionCard } from "@/components/section-card";

export default function UploadPage() {
  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Upload"
        title="A dedicated route for photo and video upload."
        description="The real upload flow will issue presigned S3 URLs, show upload progress, and persist media metadata after completion."
      >
        <UploadRequestPanel />
      </SectionCard>
    </div>
  );
}
