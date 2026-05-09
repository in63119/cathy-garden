import Image from "next/image";
import Link from "next/link";

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

        <div className="hero-actions">
          <Link href="/library" className="button-link primary">
            사진 열기
          </Link>
          <Link href="/library" className="button-link secondary">
            사진 올리기
          </Link>
        </div>
      </div>

      <div className="card hero-media-card">
        <div style={{ position: "relative", flex: 1, minHeight: "320px", overflow: "hidden", borderRadius: "22px" }}>
          <Image
            src="/logo512.png"
            alt="정원으로 둘러싸인 집"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <p
          style={{
            margin: 0,
            color: "var(--muted)",
            fontSize: "0.98rem",
            lineHeight: 1.6,
          }}
        >
          정원과 가족, 일상의 순간을 조용히 모아두는 개인 보관함입니다.
        </p>
      </div>
    </section>
  );
}
