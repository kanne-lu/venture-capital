import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNetworkScene from "@/components/admin/admin-network-scene";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRoleHomePath, type AnyRole } from "@/lib/auth/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import AdminLoginForm from "./admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-state-page">
        <section className="auth-state-card">
          <span className="section-kicker">ADMIN OPERATIONS</span>
          <h1>后台还差一步配置</h1>
          <p>请先配置 Supabase 环境变量，管理员登录才能连接认证服务。</p>
          <Link className="primary-action" href="/login">返回用户入口</Link>
        </section>
      </main>
    );
  }

  const currentUser = await getCurrentUser();
  if (currentUser) {
    if (currentUser.profile.role === "admin" && currentUser.profile.admin_role) redirect("/admin");
    if (currentUser.profile.role === "admin") redirect("/login?reason=admin-not-enabled");
    redirect(getRoleHomePath(currentUser.profile.role as AnyRole));
  }

  const { reason } = await searchParams;
  const initialMessage = reason === "auth-required" ? "请使用已授权的管理员账号登录。" : "";

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-visual" aria-label="启峰创投运营后台">
        <div className="admin-auth-grid" aria-hidden="true" />
        <AdminNetworkScene />
        <div className="admin-auth-visual-content">
          <Link className="admin-auth-brand" href="/" aria-label="返回启峰创投首页"><img src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" /></Link>
          <div className="admin-auth-copy">
            <span className="admin-auth-kicker">QIFENG CAPITAL / OPERATIONS</span>
            <h1>把每一次审核，<br /><span>变成可信连接。</span></h1>
            <p>运营后台负责审核主体、项目与 BP 授权，让每一次连接都留下清晰、可追踪的判断。</p>
          </div>
          <div className="admin-auth-signal"><span>审核</span><i /> <span>授权</span><i /> <span>留痕</span><strong>SECURE OPERATIONS</strong></div>
        </div>
      </section>
      <section className="admin-auth-panel">
        <div className="admin-auth-panel-inner">
          <div className="admin-auth-top"><span>管理员入口</span><Link href="/login">返回用户入口</Link></div>
          <div className="admin-auth-heading"><span className="admin-auth-kicker">AUTHORIZED ACCESS</span><h2>进入运营管理后台</h2><p>使用已配置的管理员账号登录，开始处理平台审核工作。</p></div>
          <AdminLoginForm initialMessage={initialMessage} />
          <p className="admin-auth-footnote">管理员账号由平台统一配置。普通用户请返回用户入口完成注册。</p>
        </div>
      </section>
    </main>
  );
}
