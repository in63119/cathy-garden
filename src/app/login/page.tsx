import { SectionCard } from "@/components/section-card";

export default function LoginPage() {
  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Login"
        title="The private entrance stays simple."
        description="This route is reserved for the future private gate. It will handle the first secure step before Cathy enters the archive."
      >
        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          <label htmlFor="private-code" style={{ fontWeight: 700 }}>
            Private access code
          </label>
          <input
            id="private-code"
            type="password"
            placeholder="Coming soon"
            disabled
            style={{
              borderRadius: "16px",
              border: "1px solid var(--border)",
              padding: "14px 16px",
              background: "rgba(255,255,255,0.78)",
            }}
          />
        </div>
      </SectionCard>
    </div>
  );
}
