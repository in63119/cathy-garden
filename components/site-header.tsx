import Link from "next/link";

import { isAuthenticated } from "@/lib/auth-server";

const publicLinks = [{ href: "/", label: "홈" }];
const privateLinks = [
  { href: "/library", label: "사진" },
  { href: "/contests", label: "공모전" },
];

export async function SiteHeader() {
  const authenticated = await isAuthenticated();
  const links = authenticated
    ? [...publicLinks, ...privateLinks]
    : [...publicLinks, { href: "/login", label: "로그인" }];

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

          <nav aria-label="주요 메뉴" className="header-nav">
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
                  로그아웃
                </button>
              </form>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
