import { notFound } from "next/navigation";
import { requirePlatformRole } from "@/lib/auth/redirects";
import { isPlatformRole } from "@/lib/auth/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import RoleWorkspace from "../role-workspace";

export const dynamic = "force-dynamic";

export default async function RoleWorkspacePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!isPlatformRole(role)) {
    notFound();
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-state-page">
        <section className="auth-state-card">
          <span className="section-kicker">SUPABASE SETUP</span>
          <h1>工作台还差一步配置</h1>
          <p>请先配置 Supabase 环境变量，再进入身份工作台。</p>
          <a className="primary-action" href="/login">返回登录</a>
        </section>
      </main>
    );
  }

  const currentUser = await requirePlatformRole(role);
  return <RoleWorkspace role={role} currentUser={currentUser} />;
}
