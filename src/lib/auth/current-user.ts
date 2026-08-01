import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/env";
import type { AnyRole, PlatformRole } from "./types";

export type Profile = {
  id: string;
  role: AnyRole;
  account_status: "pending_email" | "pending_review" | "approved" | "rejected" | "suspended";
  admin_role: "super_admin" | "reviewer" | null;
  subject_name: string;
  contact_name: string | null;
  phone: string | null;
  public_bio: string | null;
  public_visible: boolean;
  email_verified_at: string | null;
  approval_reason: string | null;
};

export type Organization = {
  id: string;
  owner_user_id: string;
  role: PlatformRole;
  name: string;
  location: string | null;
  logo_path: string | null;
  verification_status: "unsubmitted" | "pending" | "verified" | "rejected";
};

export type CurrentUser = {
  authUser: User;
  profile: Profile;
  organization: Organization | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const [profileResult, organizationResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authData.user.id).maybeSingle(),
    supabase.from("organizations").select("*").eq("owner_user_id", authData.user.id).maybeSingle(),
  ]);

  if (profileResult.error || !profileResult.data) {
    return null;
  }

  return {
    authUser: authData.user,
    profile: profileResult.data as Profile,
    organization: (organizationResult.data as Organization | null) ?? null,
  };
}
