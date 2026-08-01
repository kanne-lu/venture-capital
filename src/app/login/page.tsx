"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getRoleHomePath, type PlatformRole } from "@/lib/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type AuthMode = "login" | "register";
type Role = "投资机构" | "FA" | "政府招商" | "项目方";
type IconName = "building" | "users" | "government" | "briefcase" | "shield" | "arrow" | "check";

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  contact: string;
  phone: string;
  subject: string;
};

const roles: Array<{ name: Role; short: string; description: string; icon: IconName; subjectLabel: string; subjectPlaceholder: string }> = [
  { name: "投资机构", short: "资本", description: "发现项目 · 管理关注", icon: "building", subjectLabel: "机构名称", subjectPlaceholder: "请输入机构全称" },
  { name: "FA", short: "FA", description: "连接资源 · 推荐项目", icon: "users", subjectLabel: "服务主体", subjectPlaceholder: "请输入 FA / 顾问主体名称" },
  { name: "政府招商", short: "政", description: "产业招商 · 项目引进", icon: "government", subjectLabel: "招商部门 / 区域", subjectPlaceholder: "请输入部门或区域名称" },
  { name: "项目方", short: "项", description: "发布项目 · 获取融资", icon: "briefcase", subjectLabel: "公司名称", subjectPlaceholder: "请输入公司全称" },
];

const roleToDbRole: Record<Role, PlatformRole> = {
  投资机构: "investor",
  FA: "fa",
  政府招商: "government",
  项目方: "project",
};

function LoginIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "building":
      return <svg {...common}><path d="M4 20V5l8-2 8 2v15" /><path d="M8 8h1M8 12h1M8 16h1M15 8h1M15 12h1M15 16h1M3 20h18" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3A4.5 4.5 0 0 1 15 18.5V20" /><path d="M15 5.5a3 3 0 0 1 0 5.8M17 14.3a4.5 4.5 0 0 1 4 4.2V20" /></svg>;
    case "government":
      return <svg {...common}><path d="m3 9 9-5 9 5" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M2 9h20" /></svg>;
    case "briefcase":
      return <svg {...common}><rect x="3" y="6.5" width="18" height="13" rx="2" /><path d="M8 6.5V4h8v2.5M3 11h18M10 11v2h4v-2" /></svg>;
    case "shield":
      return <svg {...common}><path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    default:
      return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
  }
}

function AuthReferenceBlob({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 500 350" preserveAspectRatio="none" focusable="false">
      <g transform="translate(628,-17) scale(100)" opacity="0.3">
        <path
          className="auth-reference-blob-back"
          d="M4.10125 0 C4.10125 0.5525 4.3542 0.8338 4.1835 1.3593 S3.6427 1.9637 3.318 2.4107 S3.0325 3.2339 2.5855 3.5587 S1.7928 3.7298 1.2674 3.9005 S0.5525 4.3988 0 4.3988 S-0.7419 4.0713 -1.2674 3.9005 S-2.1385 3.8834 -2.5855 3.5587 S-2.9932 2.8576 -3.318 2.4107 S-4.0127 1.8847 -4.1835 1.3593 S-4.1013 0.5525 -4.1013 0 S-4.3542 -0.8338 -4.1835 -1.3593 S-3.6427 -1.9637 -3.318 -2.4107 S-3.0325 -3.2339 -2.5855 -3.5587 S-1.7928 -3.7298 -1.2674 -3.9005 S-0.5525 -4.3988 0 -4.3988 S0.7419 -4.0713 1.2674 -3.9005 S2.1385 -3.8834 2.5855 -3.5587 S2.9932 -2.8576 3.318 -2.4107 S4.0127 -1.8847 4.1835 -1.3593 S4.1013 -0.5525 4.1013 0"
          strokeWidth="0"
          transform="rotate(19)"
        >
          <animateTransform className="auth-reference-blob-animation" attributeName="transform" type="rotate" dur="10s" repeatCount="indefinite" values="0;36" />
        </path>
      </g>
      <g transform="translate(704,-56) scale(100)" opacity="0.9">
        <path
          className="auth-reference-blob-front"
          d="M4.9215 0 C4.9215 0.663 5.225 1.0006 5.0202 1.6311 S4.3713 2.3564 3.9816 2.8928 S3.639 3.8807 3.1026 4.2704 S2.1514 4.4757 1.5208 4.6806 S0.663 5.2785 0 5.2785 S-0.8903 4.8855 -1.5208 4.6806 S-2.5662 4.6601 -3.1026 4.2704 S-3.5919 3.4292 -3.9816 2.8928 S-4.8153 2.2617 -5.0202 1.6311 S-4.9215 0.663 -4.9215 0 S-5.225 -1.0006 -5.0202 -1.6311 S-4.3713 -2.3564 -3.9816 -2.8928 S-3.639 -3.8807 -3.1026 -4.2704 S-2.1514 -4.4757 -1.5208 -4.6806 S-0.663 -5.2785 0 -5.2785 S0.8903 -4.8855 1.5208 -4.6806 S2.5662 -4.6601 3.1026 -4.2704 S3.5919 -3.4292 3.9816 -2.8928 S4.8153 -2.2617 5.0202 -1.6311 S4.9215 -0.663 4.9215 0"
          strokeWidth="0"
          transform="rotate(2.04427)"
        >
          <animateTransform className="auth-reference-blob-animation" attributeName="transform" type="rotate" dur="6s" repeatCount="indefinite" values="0;36" />
        </path>
      </g>
    </svg>
  );
}

const initialForm: FormValues = { email: "", password: "", confirmPassword: "", contact: "", phone: "", subject: "" };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form, setForm] = useState<FormValues>(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedRoleMeta = roles.find((role) => role.name === selectedRole) || roles[0];

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
  };

  const updateField = (field: keyof FormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const validate = () => {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "请输入正确的邮箱地址。";
    if (!form.password || form.password.length < 6) return "密码至少需要 6 位。";
    if (mode === "login") return "";
    if (!selectedRole) return "请先选择注册身份。";
    if (!form.subject.trim() || !form.contact.trim()) return "请填写主体名称和联系人。";
    if (!/^1\d{10}$/.test(form.phone)) return "请输入 11 位手机号。";
    if (form.password !== form.confirmPassword) return "两次输入的密码不一致。";
    return "";
  };

  const requestPasswordReset = async () => {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("请先填写注册时使用的邮箱地址。");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("当前环境还没有连接 Supabase，请先配置环境变量。");
      return;
    }

    setError("");
    setNotice("");
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizeEmail(form.email), {
      redirectTo: `${window.location.origin}/login/reset`,
    });

    setSubmitting(false);
    if (resetError) {
      setError(resetError.message || "密码重置邮件发送失败，请稍后再试。");
      return;
    }

    setNotice("密码重置邮件已发送，请检查邮箱。");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError("");
    setSubmitting(true);

    if (!isSupabaseConfigured()) {
      setSubmitting(false);
      setError("当前环境还没有连接 Supabase，请先配置环境变量。");
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: normalizeEmail(form.email),
          password: form.password,
        });

        if (loginError) {
          setSubmitting(false);
          setError(loginError.message || "邮箱或密码不正确。");
          return;
        }

        router.push("/account");
        router.refresh();
        return;
      }

      const role = roleToDbRole[selectedRole as Role];
      const { data, error: registerError } = await supabase.auth.signUp({
        email: normalizeEmail(form.email),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role,
            subject_name: form.subject.trim(),
            contact_name: form.contact.trim(),
            phone: form.phone.trim(),
            terms_accepted: "true",
            terms_version: "2026-08-01",
          },
        },
      });

      if (registerError) {
        setSubmitting(false);
        setError(registerError.message || "注册失败，请稍后再试。");
        return;
      }

      if (data.user?.identities?.length === 0) {
        setSubmitting(false);
        setError("这个邮箱已经注册，请切换到登录并使用原密码。");
        return;
      }

      setSubmitting(false);
      if (data.session) {
        setNotice("注册成功，正在进入你的个人中心…");
        router.push(getRoleHomePath(role));
        router.refresh();
      } else {
        setNotice("注册成功，请先验证邮箱；验证后即可进入你的个人中心。");
      }
    } catch {
      setSubmitting(false);
      setError("认证服务暂时不可用，请检查 Supabase 配置后重试。");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="auth-grid-lines" />

      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <Link href="/" className="auth-brand" aria-label="返回启峰创投首页"><img src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" /></Link>
          <div className="auth-brand-copy"><span className="auth-eyebrow">QIFENG CAPITAL NETWORK</span><h1>让每一次连接，<br /><span>都更有价值。</span></h1><p>一个更高效的创投连接平台，让项目、资本与产业资源在可信的环境里遇见彼此。</p></div>
          <div className="auth-connection-card"><div className="auth-connection-top"><span>ONE PLATFORM</span><b>04 ROLES</b></div><div className="auth-role-orbit"><div className="auth-orbit orbit-small" /><div className="auth-orbit orbit-large" /><div className="auth-orbit-core"><small>连接</small><strong>启峰</strong></div><span className="auth-orbit-node orbit-node-one">资本</span><span className="auth-orbit-node orbit-node-two">FA</span><span className="auth-orbit-node orbit-node-three">政</span><span className="auth-orbit-node orbit-node-four">项</span></div><div className="auth-connection-bottom"><span>DISCOVER · MATCH · MOVE</span><em>现在，进入你的下一步</em></div></div>
          <div className="auth-brand-proof"><span><LoginIcon name="shield" size={16} />主体与项目审核</span><span><LoginIcon name="check" size={16} />信息边界清晰</span></div>
        </div>
      <div className="auth-divider-wave" aria-hidden="true">
        <AuthReferenceBlob className="auth-divider-wave-vertical" />
        <AuthReferenceBlob className="auth-divider-wave-horizontal" />
      </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-top"><span>已有账号？<button type="button" onClick={() => switchMode("login")}>直接登录</button></span><Link href="/">返回首页</Link></div>
          <div className="auth-form-heading"><span className="auth-form-kicker">{mode === "login" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}</span><h2>{mode === "login" ? "欢迎回到启峰创投" : "创建你的平台身份"}</h2><p>{mode === "login" ? "登录后继续发现项目、资本与产业机会。" : "先选择身份，再完成主体信息注册。"}</p></div>
          <div className="auth-mode-switch" role="tablist" aria-label="认证模式"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>登录</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>注册</button></div>

          {mode === "register" && <div className="auth-register-step"><div className="auth-step-heading"><span>STEP 01</span><b>选择注册身份</b></div><div className="auth-role-grid">{roles.map((role) => <button type="button" className={`auth-role-card ${selectedRole === role.name ? "selected" : ""}`} key={role.name} onClick={() => { setSelectedRole(role.name); setError(""); }}><span className="auth-role-icon"><LoginIcon name={role.icon} size={19} /></span><span><strong>{role.name}</strong><small>{role.description}</small></span>{selectedRole === role.name && <i><LoginIcon name="check" size={14} /></i>}</button>)}</div></div>}

          <form className={`auth-form ${mode === "register" ? "register-form" : ""}`} onSubmit={submit} noValidate>
            {mode === "register" && <div className="auth-form-section-label"><span>STEP 02</span><b>填写主体信息</b></div>}
            {mode === "register" && <label className="auth-field">{selectedRoleMeta.subjectLabel}<input value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder={selectedRoleMeta.subjectPlaceholder} /></label>}
            {mode === "register" && <label className="auth-field">联系人姓名<input autoComplete="name" value={form.contact} onChange={(event) => updateField("contact", event.target.value)} placeholder="请输入联系人姓名" /></label>}
            {mode === "register" && <label className="auth-field">手机号<input autoComplete="tel" inputMode="numeric" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="请输入 11 位手机号" /></label>}
            <label className="auth-field">邮箱地址<input autoComplete="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="name@company.com" /></label>
            <label className="auth-field">密码<input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="至少 6 位密码" /></label>
            {mode === "register" && <label className="auth-field">确认密码<input autoComplete="new-password" type="password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} placeholder="再次输入密码" /></label>}
            {mode === "login" && <div className="auth-form-meta"><label><input type="checkbox" />记住本次登录</label><button type="button" onClick={() => void requestPasswordReset()}>忘记密码？</button></div>}
            {error && <p className="auth-feedback error" role="alert">{error}</p>}
            {notice && <p className="auth-feedback success" role="status"><LoginIcon name="check" size={15} />{notice}</p>}
            <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "正在处理…" : mode === "login" ? "登录启峰创投" : "完成注册并进入平台"}<LoginIcon name="arrow" size={16} /></button>
          </form>
          <button className="auth-guest-link" type="button" onClick={() => router.push("/#market")}>继续浏览公开项目市场 <LoginIcon name="arrow" size={14} /></button>
          <p className="auth-legal">继续操作即表示你同意启峰创投的服务条款与隐私说明。</p>
        </div>
      </section>
    </main>
  );
}
