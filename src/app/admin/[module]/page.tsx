import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import AdminModule from "./admin-module";

const modules = ["users", "projects", "bp", "reports", "content", "audit"] as const;
type AdminModuleKey = (typeof modules)[number];

export const dynamic = "force-dynamic";

const moduleLabels: Record<AdminModuleKey, string> = {
  users: "主体审核",
  projects: "项目审核",
  bp: "BP 与授权",
  reports: "举报处理",
  content: "平台内容",
  audit: "操作审计",
};

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!modules.includes(module as AdminModuleKey)) notFound();
  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-state-page">
        <section className="auth-state-card"><span className="section-kicker">SUPABASE SETUP</span><h1>后台还差一步配置</h1><p>请先配置 Supabase 环境变量，后台才可以读取审核队列。</p><a className="primary-action" href="/login">返回登录</a></section>
      </main>
    );
  }

  const currentUser = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const key = module as AdminModuleKey;
  if (currentUser.profile.admin_role === "reviewer" && ["content", "audit"].includes(key)) {
    redirect("/admin");
  }
  let rows: Record<string, unknown>[] = [];

  if (key === "users") {
    const { data } = await supabase.from("profiles").select("id, role, account_status, subject_name, contact_name, phone, created_at, approval_reason").in("account_status", ["pending_review", "rejected"]).order("created_at", { ascending: true });
    rows = (data ?? []) as Record<string, unknown>[];
  } else if (key === "projects") {
    const { data } = await supabase.from("projects").select("id, name, company, summary, industry, stage, city, amount, status, created_at, review_reason").in("status", ["pending_review", "revision_requested"]).order("created_at", { ascending: true });
    rows = (data ?? []) as Record<string, unknown>[];
  } else if (key === "bp") {
    const { data } = await supabase.from("bp_access_requests").select("id, project_id, requested_by, reason, status, created_at").eq("status", "pending").order("created_at", { ascending: true });
    rows = (data ?? []) as Record<string, unknown>[];
  } else if (key === "reports") {
    const { data } = await supabase.from("reports").select("id, reporter_id, project_id, organization_id, content_entry_id, reason, detail, status, created_at").in("status", ["pending", "reviewing"]).order("created_at", { ascending: true });
    rows = (data ?? []) as Record<string, unknown>[];
  } else if (key === "content") {
    const { data } = await supabase.from("content_entries").select("id, content_type, slug, title, summary, status, updated_at").order("updated_at", { ascending: false }).limit(50);
    rows = (data ?? []) as Record<string, unknown>[];
  } else {
    const { data } = await supabase.from("audit_logs").select("id, actor_user_id, action, resource_type, resource_id, metadata, created_at").order("created_at", { ascending: false }).limit(80);
    rows = (data ?? []) as Record<string, unknown>[];
  }

  return <AdminModule moduleKey={key} moduleLabel={moduleLabels[key]} adminName={currentUser.profile.subject_name} adminRole={currentUser.profile.admin_role} rows={rows} />;
}
