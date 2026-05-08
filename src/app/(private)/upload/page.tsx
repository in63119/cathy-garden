import { UploadRequestPanel } from "@/components/upload-request-panel";
import { SectionCard } from "@/components/section-card";

export default function UploadPage() {
  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Upload"
        title="Add photos and videos to the archive."
        description="Choose the moments you want to keep. They will appear in the library after the upload finishes."
      >
        <UploadRequestPanel />
      </SectionCard>
    </div>
  );
}
