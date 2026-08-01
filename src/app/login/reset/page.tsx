"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function PasswordResetPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!isSupabaseConfigured()) {
      setError("当前环境还没有连接 Supabase。");
      return;
    }
    if (password.length < 6) {
      setError("新密码至少需要 6 位。");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message || "密码更新失败，请重新申请重置邮件。");
      return;
    }

    setNotice("密码已更新，请返回登录。");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <main className="auth-state-page">
      <section className="auth-state-card auth-reset-card">
        <span className="section-kicker">RESET PASSWORD</span>
        <h1>设置新密码</h1>
        <p>设置完成后，你可以使用新密码登录启峰创投。</p>
        <form className="simple-auth-form" onSubmit={submit}>
          <label>新密码<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label>确认新密码<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          {error ? <p className="auth-feedback error">{error}</p> : null}
          {notice ? <p className="auth-feedback success">{notice}</p> : null}
          <button className="primary-action full" type="submit" disabled={submitting}>{submitting ? "正在保存…" : "保存新密码"}</button>
        </form>
        <Link className="auth-state-link" href="/login">返回登录</Link>
      </section>
    </main>
  );
}
