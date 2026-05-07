import { HeroSection } from "@/components/hero-section";
import { SectionCard } from "@/components/section-card";

const highlights = [
  {
    eyebrow: "Upload",
    title: "Bring in phone photos and videos with room to grow.",
    description:
      "The first version focuses on safe upload flows and a calm mobile experience, then expands feature by feature.",
  },
  {
    eyebrow: "Library",
    title: "See everything as a private home archive, not a dashboard.",
    description:
      "The media library will become the daily center of the app, with room for thumbnails, dates, and later albums.",
  },
  {
    eyebrow: "Storage",
    title: "Keep originals in Amazon S3 while the app manages the experience.",
    description:
      "The Next.js app will handle access, metadata, and upload orchestration while S3 stores the actual media files.",
  },
];

export default function HomePage() {
  return (
    <>
      <HeroSection
        title="A quiet archive built around a garden home."
        description="Cathy Garden is becoming a private place for uploading, keeping, and revisiting the photos and videos that matter most."
      />

      <section
        className="content-shell"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          paddingBottom: "48px",
        }}
      >
        {highlights.map((highlight) => (
          <SectionCard
            key={highlight.eyebrow}
            eyebrow={highlight.eyebrow}
            title={highlight.title}
            description={highlight.description}
          />
        ))}
      </section>
    </>
  );
}
