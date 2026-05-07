import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="page-frame">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
