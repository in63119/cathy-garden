import Link from "next/link";

import { SectionCard } from "@/components/section-card";

const placeholders = [
  "Seasonal garden weekends",
  "Home videos ready for S3 upload",
  "Future albums and thumbnails",
];

export default function LibraryPage() {
  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Library"
        title="The media library starts as the center of the new app."
        description="This page will list uploaded photos and videos once authentication, S3 uploads, and metadata storage are connected."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          {placeholders.map((item) => (
            <div
              key={item}
              style={{
                minHeight: "160px",
                borderRadius: "22px",
                border: "1px dashed var(--border)",
                padding: "18px",
                background: "rgba(255,255,255,0.42)",
                display: "flex",
                alignItems: "flex-end",
                color: "var(--muted)",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/upload" className="button-link primary">
            Go to upload
          </Link>
          <Link href="/media/sample" className="button-link secondary">
            View a sample detail route
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
