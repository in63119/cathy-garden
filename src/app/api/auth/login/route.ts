import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import {
  establishAuthenticatedSession,
  validateLoginAttempt,
} from "@/lib/auth-server";
import { getSafeRedirectPath } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const redirectTo = getSafeRedirectPath(String(formData.get("redirectTo") ?? ""));

  const result = validateLoginAttempt(password);

  if (!result.ok) {
    redirect(`/login?error=${result.reason}&next=${encodeURIComponent(redirectTo)}`);
  }

  await establishAuthenticatedSession();
  redirect(redirectTo);
}
