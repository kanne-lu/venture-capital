"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const ADMIN_LOGIN_EMAIL = "admin@qifeng.capital";

function resolveAdminEmail(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  return normalized === "admin" ? ADMIN_LOGIN_EMAIL : normalized;
}

function isAdminIdentifierValid(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  return normalized === "admin" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export default function AdminLoginForm({ initialMessage = "" }: { initialMessage?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initialMessage);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!identifier.trim() || !isAdminIdentifierValid(identifier)) {
      setError("请输入 admin 或管理员邮箱地址。");
      return;
    }
    if (!password) {
      setError("请输入管理员密码。");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("当前环境还没有连接 Supabase，请先配置认证环境变量。");
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: resolveAdminEmail(identifier), password });
    setSubmitting(false);

    if (loginError) {
      setError("登录失败，请确认账号已验证并已获得管理员权限。");
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  const requestPasswordReset = async () => {
    setError("");
    setNotice("");
    if (!identifier.trim() || !isAdminIdentifierValid(identifier)) {
      setError("请先填写 admin 或管理员邮箱地址。");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("当前环境还没有连接 Supabase。");
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resolveAdminEmail(identifier), {
      redirectTo: `${window.location.origin}/login/reset`,
    });
    setSubmitting(false);
    if (resetError) {
      setError("密码重置邮件发送失败，请稍后重试。");
      return;
    }
    setNotice("密码重置邮件已发送，请检查管理员邮箱。");
  };

  return (
    <form className="admin-auth-form" onSubmit={submit} noValidate>
      <label className="admin-auth-field">
        <span>管理员账号 / 邮箱</span>
        <input type="text" autoComplete="username" value={identifier} onChange={(event) => { setIdentifier(event.target.value); setError(""); }} placeholder="admin 或 admin@qifeng.capital" />
      </label>
      <label className="admin-auth-field">
        <span>登录密码</span>
        <input type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="请输入管理员密码" />
      </label>
      <div className="admin-auth-meta">
        <span>仅限已配置的运营账号</span>
        <button type="button" onClick={() => void requestPasswordReset()} disabled={submitting}>忘记密码？</button>
      </div>
      {error ? <p className="admin-auth-feedback error" role="alert">{error}</p> : null}
      {notice ? <p className="admin-auth-feedback notice" role="status">{notice}</p> : null}
      <button className="admin-auth-submit" type="submit" disabled={submitting}>
        <span>{submitting ? "正在验证…" : "进入运营后台"}</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </form>
  );
}
