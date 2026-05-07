import type { ReactNode } from "react";

type SectionCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <section
      className="card"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <span className="eyebrow">{eyebrow}</span>
      <h2 style={{ margin: 0, fontSize: "1.6rem" }}>{title}</h2>
      <p
        style={{
          margin: 0,
          color: "var(--muted)",
          lineHeight: 1.7,
        }}
      >
        {description}
      </p>
      {children}
    </section>
  );
}
