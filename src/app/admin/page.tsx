import Link from "next/link";
import { requireAdmin } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const adminModules = [
  ["主体审核", "users", "审核四类入驻主体和资质材料"],
  ["项目审核", "projects", "管理项目、招商机会和公开内容"],
  ["BP 与授权", "bp", "查看私有 BP 请求和授权状态"],
  ["举报处理", "reports", "处理风险内容和账号限制"],
  ["平台内容", "content", "编辑平台介绍、公告和分类"],
  ["操作审计", "audit", "追踪管理员和敏感数据操作"],
] as const;

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-state-page">
        <section className="auth-state-card">
          <span className="section-kicker">SUPABASE SETUP</span>
          <h1>后台还差一步配置</h1>
          <p>请先配置 Supabase 环境变量，后台才可以读取审核队列。</p>
          <a className="primary-action" href="/login">返回登录</a>
        </section>
      </main>
    );
  }

  const currentUser = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [pendingProfiles, pendingProjects, pendingBp, pendingReports] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "pending_review"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("bp_access_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats = [
    [String(pendingProfiles.count ?? 0).padStart(2, "0"), "待审核主体"],
    [String(pendingProjects.count ?? 0).padStart(2, "0"), "待审核项目"],
    [String(pendingBp.count ?? 0).padStart(2, "0"), "BP 查看申请"],
    [String(pendingReports.count ?? 0).padStart(2, "0"), "待处理举报"],
  ];

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-topbar"><div><span className="admin-brand-kicker">QIFENG CAPITAL · OPERATIONS</span><h1>运营管理后台</h1></div><div className="admin-account"><span>{currentUser.profile.subject_name}</span><Link href="/">返回前台</Link></div></header>
        <div className="admin-layout">
          <aside className="admin-sidebar"><div className="admin-side-title">WORKSPACE</div><nav>{adminModules.map(([label, key]) => <Link href={`/admin/${key}`} key={key} className={key === "users" ? "active" : ""}><i>{key.slice(0, 1).toUpperCase()}</i>{label}</Link>)}</nav><div className="admin-side-note"><strong>Supabase Studio</strong><span>用于底层数据、Auth 和 Storage 管理。</span></div></aside>
          <section className="admin-main"><div className="admin-welcome"><div><span className="admin-kicker">TODAY AT QIFENG</span><h2>把审核工作，做得更清楚</h2><p>所有主体、项目和 BP 权限都在这里留下可追踪的记录。</p></div><span className="admin-date">{new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())}</span></div><div className="admin-stat-grid">{stats.map(([value, label]) => <div className="admin-stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>需要你的关注</small></div>)}</div><div className="admin-panel-grid"><section className="admin-panel admin-priority"><div className="admin-panel-heading"><div><span className="admin-kicker">PRIORITY QUEUE</span><h3>今天优先处理</h3></div><Link href="/admin/users">进入审核 →</Link></div><div className="admin-queue-item"><span className="admin-queue-index">01</span><div><b>主体认证审核</b><small>确认机构、FA、政府和项目方的真实资料</small></div><strong>{stats[0][0]}</strong></div><div className="admin-queue-item"><span className="admin-queue-index">02</span><div><b>项目公开审核</b><small>检查项目简介、融资信息和 BP 版本</small></div><strong>{stats[1][0]}</strong></div><div className="admin-queue-item"><span className="admin-queue-index">03</span><div><b>授权申请处理</b><small>保护项目方信息边界，确认 BP 查看范围</small></div><strong>{stats[2][0]}</strong></div></section><section className="admin-panel admin-boundary"><span className="admin-kicker">OPERATING PRINCIPLES</span><h3>清晰的边界，才有可信的连接</h3><p>前台负责展示和连接，后台负责审核、授权和留痕。任何敏感数据都不通过前端状态决定权限。</p><div className="admin-principle"><b>01</b><span>主体先认证<br /><small>真实组织才进入完整工作台</small></span></div><div className="admin-principle"><b>02</b><span>BP 先授权<br /><small>项目方始终拥有访问控制权</small></span></div><div className="admin-principle"><b>03</b><span>操作可追踪<br /><small>审核与敏感操作写入日志</small></span></div></section></div></section>
        </div>
      </div>
    </main>
  );
}
