import { redirect } from "next/navigation";

import { clearAuthenticatedSession } from "@/lib/auth-server";

export async function POST() {
  await clearAuthenticatedSession();
  redirect("/login");
}
