import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRoleHomePath, type AnyRole } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login?error=verification-failed", requestUrl));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=verification-failed", requestUrl));
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login?error=profile-sync-failed", requestUrl));
  }

  return NextResponse.redirect(new URL(getRoleHomePath(currentUser.profile.role as AnyRole), requestUrl));
}
