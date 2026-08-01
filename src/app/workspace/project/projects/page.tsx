import { redirect } from "next/navigation";
import { requirePlatformRole } from "@/lib/auth/redirects";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProjectManager from "./project-manager";

export const dynamic = "force-dynamic";

export default async function ProjectManagerPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-state-page">
        <section className="auth-state-card">
          <span className="section-kicker">SUPABASE SETUP</span>
          <h1>项目管理还差一步配置</h1>
          <p>请先配置 Supabase 环境变量，再提交项目和上传 BP。</p>
          <a className="primary-action" href="/login">返回登录</a>
        </section>
      </main>
    );
  }

  const currentUser = await requirePlatformRole("project");
  if (!currentUser.organization) redirect("/profile");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("projects").select("id, name, company, summary, industry, stage, city, amount, status, review_reason, created_at").eq("organization_id", currentUser.organization.id).order("created_at", { ascending: false });

  return <ProjectManager subjectName={currentUser.profile.subject_name} accountStatus={currentUser.profile.account_status} projects={(data ?? []) as ProjectManagerProject[]} />;
}

export type ProjectManagerProject = {
  id: string;
  name: string;
  company: string;
  summary: string;
  industry: string;
  stage: string;
  city: string;
  amount: number | null;
  status: string;
  review_reason: string | null;
  created_at: string;
};
