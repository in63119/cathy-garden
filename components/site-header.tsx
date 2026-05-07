import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/upload", label: "Upload" },
  { href: "/login", label: "Login" },
];

export function SiteHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        padding: "20px 0 12px",
      }}
    >
      <div className="content-shell">
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "14px 18px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span className="eyebrow">Private Archive</span>
            <strong style={{ fontSize: "1.25rem" }}>Cathy Garden</strong>
          </Link>

          <nav
            aria-label="Primary"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="button-link secondary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
