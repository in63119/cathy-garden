import { SectionCard } from "@/components/section-card";

type MediaDetailPageProps = {
  params: {
    id: string;
  };
};

export default function MediaDetailPage({
  params,
}: MediaDetailPageProps) {
  const { id } = params;

  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Media Detail"
        title={`Detail route reserved for media item: ${id}`}
        description="This route will eventually render either a full photo view or a video player with metadata and delete actions."
      >
        <div
          style={{
            minHeight: "320px",
            borderRadius: "24px",
            border: "1px dashed var(--border)",
            background: "rgba(255,255,255,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            color: "var(--muted)",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          Media preview placeholder for <strong style={{ marginLeft: "6px" }}>{id}</strong>
        </div>
      </SectionCard>
    </div>
  );
}
