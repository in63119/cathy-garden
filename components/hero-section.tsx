import Image from "next/image";

type HeroSectionProps = {
  title: string;
  description: string;
};

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section
      className="content-shell hero-grid"
    >
      <div className="card hero-copy-card">
        <span className="eyebrow">Private Archive</span>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            lineHeight: 0.95,
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--muted)",
            fontSize: "1.05rem",
            lineHeight: 1.7,
            maxWidth: "34rem",
          }}
        >
          {description}
        </p>

        <div className="hero-feature-panel">
          <div className="hero-media-frame">
            <Image
              src="/logo512.png"
              alt="정원으로 둘러싸인 집"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 560px"
              style={{ objectFit: "cover" }}
            />
          </div>
          <p className="hero-media-caption">
            한 사람만을 위한 일정, 사진, 공모전 기록을 조용히 모아두는 개인 기능 사이트입니다.
          </p>
        </div>
      </div>
    </section>
  );
}
