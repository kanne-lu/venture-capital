import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isPlatformRole } from "@/lib/auth/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

const roleProfileTables = {
  investor: "investor_profiles",
  fa: "fa_profiles",
  government: "government_profiles",
  project: "project_profiles",
} as const;

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-state-page">
        <section className="auth-state-card">
          <span className="section-kicker">SUPABASE SETUP</span>
          <h1>个人中心还差一步配置</h1>
          <p>请先配置 Supabase 环境变量，资料才可以保存到线上数据库。</p>
          <a className="primary-action" href="/login">返回登录</a>
        </section>
      </main>
    );
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login?reason=auth-required");
  }

  if (!isPlatformRole(currentUser.profile.role)) {
    redirect("/admin");
  }

  const supabase = await createSupabaseServerClient();
  const roleProfileResult = currentUser.organization
    ? await supabase.from(roleProfileTables[currentUser.profile.role]).select("*").eq("organization_id", currentUser.organization.id).maybeSingle()
    : { data: null };

  return (
    <ProfileForm
      userId={currentUser.profile.id}
      email={currentUser.authUser.email ?? ""}
      role={currentUser.profile.role}
      accountStatus={currentUser.profile.account_status}
      profile={{
        subjectName: currentUser.profile.subject_name,
        contactName: currentUser.profile.contact_name ?? "",
        phone: currentUser.profile.phone ?? "",
        publicBio: currentUser.profile.public_bio ?? "",
        location: currentUser.organization?.location ?? "",
        logoPath: currentUser.organization?.logo_path ?? "",
      }}
      organization={currentUser.organization ? { id: currentUser.organization.id, name: currentUser.organization.name, location: currentUser.organization.location, logo_path: currentUser.organization.logo_path } : null}
      roleProfile={(roleProfileResult.data as Record<string, unknown> | null) ?? null}
    />
  );
}
