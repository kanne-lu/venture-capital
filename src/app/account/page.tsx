import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRoleHomePath, type AnyRole } from "@/lib/auth/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-state-page">
        <section className="auth-state-card">
          <span className="section-kicker">SUPABASE SETUP</span>
          <h1>还差一步，连接真实认证服务</h1>
          <p>请在本地或 Vercel 环境变量中配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。</p>
          <a className="primary-action" href="/login">返回登录</a>
        </section>
      </main>
    );
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login?reason=auth-required");
  }

  redirect(getRoleHomePath(currentUser.profile.role as AnyRole));
}
