import { UploadRequestPanel } from "@/components/upload-request-panel";
import { SectionCard } from "@/components/section-card";

export default function UploadPage() {
  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="올리기"
        title="사진과 영상 올리기"
        description="간직하고 싶은 순간을 선택하세요. 업로드가 끝나면 보관함에서 바로 볼 수 있습니다."
      >
        <UploadRequestPanel />
      </SectionCard>
    </div>
  );
}
