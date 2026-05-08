import Link from "next/link";

import { isAuthenticated } from "@/lib/auth-server";

const publicLinks = [{ href: "/", label: "Home" }];
const privateLinks = [
  { href: "/library", label: "Library" },
  { href: "/upload", label: "Upload" },
];

export async function SiteHeader() {
  const authenticated = await isAuthenticated();
  const links = authenticated
    ? [...publicLinks, ...privateLinks]
    : [...publicLinks, { href: "/login", label: "Login" }];

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
        <div className="card header-card">
          <Link href="/" className="header-brand">
            <strong style={{ fontSize: "1.25rem" }}>Cathy Garden</strong>
          </Link>

          <nav aria-label="Primary" className="header-nav">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="button-link secondary"
              >
                {link.label}
              </Link>
            ))}

            {authenticated ? (
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="button-link secondary"
                  style={{ cursor: "pointer" }}
                >
                  Logout
                </button>
              </form>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
