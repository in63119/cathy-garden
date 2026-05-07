import type { ReactNode } from "react";

import { requireAuthenticatedSession } from "@/lib/auth-server";

type PrivateLayoutProps = {
  children: ReactNode;
};

export default async function PrivateLayout({
  children,
}: PrivateLayoutProps) {
  await requireAuthenticatedSession();

  return children;
}
