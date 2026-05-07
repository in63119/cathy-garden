import Image from "next/image";
import Link from "next/link";

type HeroSectionProps = {
  title: string;
  description: string;
};

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section
      className="content-shell"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        padding: "16px 0 40px",
      }}
    >
      <div
        className="card"
        style={{
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "18px",
          minHeight: "420px",
        }}
      >
        <span className="eyebrow">For Cathy Only</span>
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

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <Link href="/library" className="button-link primary">
            Open the library
          </Link>
          <Link href="/upload" className="button-link secondary">
            Start an upload
          </Link>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: "18px",
          minHeight: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ position: "relative", flex: 1, minHeight: "320px", overflow: "hidden", borderRadius: "22px" }}>
          <Image
            src="/logo512.png"
            alt="A country house surrounded by a vegetable garden"
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
          A warm, private home for photos and videos, shaped around the garden
          mood you wanted from the start.
        </p>
      </div>
    </section>
  );
}
