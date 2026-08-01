"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomePath, roleDescriptions, roleLabels, type PlatformRole } from "@/lib/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ProfileValues = {
  subjectName: string;
  contactName: string;
  phone: string;
  publicBio: string;
  location: string;
  logoPath: string;
};

type RoleValues = Record<string, string>;

type ProfileFormProps = {
  userId: string;
  email: string;
  role: PlatformRole;
  accountStatus: string;
  profile: ProfileValues;
  organization: { id: string; name: string; location: string | null; logo_path: string | null } | null;
  roleProfile: Record<string, unknown> | null;
};

const roleProfileTables: Record<PlatformRole, string> = {
  investor: "investor_profiles",
  fa: "fa_profiles",
  government: "government_profiles",
  project: "project_profiles",
};

const roleFields: Record<PlatformRole, Array<{ key: string; label: string; multiline?: boolean; placeholder?: string }>> = {
  investor: [
    { key: "institution_type", label: "机构类型", placeholder: "例如：市场化 VC / 产业资本 / 家族办公室" },
    { key: "industries", label: "关注行业", placeholder: "用顿号分隔，例如：智能制造、医疗健康" },
    { key: "stages", label: "关注阶段", placeholder: "用顿号分隔，例如：天使轮、Pre-A、A 轮" },
    { key: "regions", label: "关注区域", placeholder: "用顿号分隔，例如：长三角、粤港澳" },
    { key: "ticket_min", label: "单笔投资下限（万元）", placeholder: "例如：500" },
    { key: "ticket_max", label: "单笔投资上限（万元）", placeholder: "例如：5000" },
    { key: "introduction", label: "机构介绍", multiline: true, placeholder: "介绍投资理念、代表案例和合作方式" },
  ],
  fa: [
    { key: "industries", label: "服务行业", placeholder: "用顿号分隔，例如：先进制造、消费科技" },
    { key: "regions", label: "服务区域", placeholder: "用顿号分隔，例如：华东、华南" },
    { key: "specialties", label: "服务专长", placeholder: "用顿号分隔，例如：融资顾问、产业并购" },
    { key: "introduction", label: "服务介绍", multiline: true, placeholder: "介绍服务能力、资源网络和代表案例" },
  ],
  government: [
    { key: "department", label: "招商部门", placeholder: "例如：经济发展局 / 投资促进中心" },
    { key: "region", label: "招商区域", placeholder: "例如：苏州工业园区" },
    { key: "focus_industries", label: "重点产业", placeholder: "用顿号分隔，例如：生物医药、智能制造" },
    { key: "policy_text", label: "政策支持", multiline: true, placeholder: "介绍人才、空间、资金和产业配套政策" },
    { key: "introduction", label: "招商介绍", multiline: true, placeholder: "介绍区域产业基础和项目落地条件" },
  ],
  project: [
    { key: "company_description", label: "公司简介", multiline: true, placeholder: "介绍公司成立背景、产品和商业模式" },
    { key: "registration_number", label: "统一社会信用代码", placeholder: "请输入企业统一社会信用代码" },
    { key: "team_summary", label: "团队介绍", multiline: true, placeholder: "介绍创始团队和核心成员分工" },
    { key: "introduction", label: "项目公开介绍", multiline: true, placeholder: "这段内容会用于项目公开资料和机构初步了解" },
  ],
};

function listToText(value: unknown) {
  return Array.isArray(value) ? value.join("、") : typeof value === "string" ? value : "";
}

function roleValueFromRecord(record: Record<string, unknown> | null, key: string) {
  if (!record) return "";
  return listToText(record[key]);
}

function textToRoleValue(key: string, value: string) {
  if (["industries", "stages", "regions", "specialties", "focus_industries"].includes(key)) {
    return value.split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
  }
  if (["ticket_min", "ticket_max"].includes(key)) {
    return value.trim() ? Number(value) : null;
  }
  return value.trim() || null;
}

function Field({ label, value, placeholder, multiline, onChange }: { label: string; value: string; placeholder?: string; multiline?: boolean; onChange: (value: string) => void }) {
  return (
    <label className={`profile-field ${multiline ? "profile-field-wide" : ""}`}>
      <span>{label}</span>
      {multiline ? <textarea value={value} rows={4} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /> : <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function statusLabel(status: string) {
  if (status === "approved") return "主体审核已通过";
  if (status === "rejected") return "资料需要修改";
  if (status === "suspended") return "账号暂时停用";
  if (status === "pending_email") return "等待邮箱验证";
  return "主体资料审核中";
}

export default function ProfileForm({ userId, email, role, accountStatus, profile, organization, roleProfile }: ProfileFormProps) {
  const router = useRouter();
  const [base, setBase] = useState(profile);
  const [roleValues, setRoleValues] = useState<RoleValues>(() => Object.fromEntries(roleFields[role].map(({ key }) => [key, roleValueFromRecord(roleProfile, key)])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const updateBase = (key: keyof ProfileValues, value: string) => {
    setBase((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const updateRole = (key: string, value: string) => {
    setRoleValues((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!base.subjectName.trim() || !base.contactName.trim() || !/^1\d{10}$/.test(base.phone.trim())) {
      setError("请填写主体名称、联系人和有效的 11 位手机号。 ");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("当前环境还没有连接 Supabase。 ");
      return;
    }

    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const profileResult = await supabase.from("profiles").update({
      subject_name: base.subjectName.trim(),
      contact_name: base.contactName.trim(),
      phone: base.phone.trim(),
      public_bio: base.publicBio.trim() || null,
      public_visible: Boolean(base.publicBio.trim()),
    }).eq("id", userId);

    if (profileResult.error) {
      setSaving(false);
      setError(profileResult.error.message || "基础资料保存失败。 ");
      return;
    }

    const contactResult = await supabase.from("profile_contacts").upsert({
      user_id: userId,
      email,
      phone: base.phone.trim(),
      contact_name: base.contactName.trim(),
    }, { onConflict: "user_id" });
    if (contactResult.error) {
      setSaving(false);
      setError(contactResult.error.message || "联系人资料保存失败。 ");
      return;
    }

    if (organization) {
      const organizationResult = await supabase.from("organizations").update({
        name: base.subjectName.trim(),
        location: base.location.trim() || null,
        logo_path: base.logoPath.trim() || null,
      }).eq("id", organization.id);

      if (organizationResult.error) {
        setSaving(false);
        setError(organizationResult.error.message || "主体资料保存失败。 ");
        return;
      }

      const rolePayload = Object.fromEntries(Object.entries(roleValues).map(([key, value]) => [key, textToRoleValue(key, value)]));
      const roleResult = await supabase.from(roleProfileTables[role]).upsert({ organization_id: organization.id, ...rolePayload }, { onConflict: "organization_id" });
      if (roleResult.error) {
        setSaving(false);
        setError(roleResult.error.message || "身份资料保存失败。 ");
        return;
      }
    }

    setSaving(false);
    setNotice("资料已保存，公开展示状态会以平台审核结果为准。 ");
    router.refresh();
  };

  return (
    <main className={`profile-page profile-${role}`}>
      <div className="profile-shell">
        <header className="profile-topbar">
          <Link href={getRoleHomePath(role)} className="profile-back-link">← 返回工作台</Link>
          <Link href="/" className="profile-brand"><img src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" /></Link>
          <span className="profile-top-status">{statusLabel(accountStatus)}</span>
        </header>

        <section className="profile-heading">
          <div><span className="profile-kicker">PERSONAL CENTER</span><h1>完善你的平台资料</h1><p>你的登录身份与审核状态不会被此页面修改。身份注册后不可自行切换。</p></div>
          <div className="profile-role-stamp"><strong>{roleLabels[role]}</strong><span>{roleDescriptions[role]}</span></div>
        </section>

        <form className="profile-layout" onSubmit={save}>
          <div className="profile-main">
            <section className="profile-section">
              <div className="profile-section-heading"><div><span className="profile-section-kicker">IDENTITY</span><h2>主体基础资料</h2></div><span className="profile-section-note">注册身份不可修改</span></div>
              <div className="profile-fields-grid">
                <Field label={role === "government" ? "部门 / 区域名称" : "主体名称"} value={base.subjectName} onChange={(value) => updateBase("subjectName", value)} />
                <Field label="联系人姓名" value={base.contactName} onChange={(value) => updateBase("contactName", value)} />
                <Field label="手机号" value={base.phone} onChange={(value) => updateBase("phone", value)} />
                <Field label="所在地区" value={base.location} placeholder="例如：苏州 / 上海" onChange={(value) => updateBase("location", value)} />
                <Field label="平台公开简介" value={base.publicBio} multiline placeholder="通过审核后展示给平台其他用户的简介" onChange={(value) => updateBase("publicBio", value)} />
              </div>
            </section>

            <section className="profile-section">
              <div className="profile-section-heading"><div><span className="profile-section-kicker">ROLE PROFILE</span><h2>{roleLabels[role]}资料</h2></div><span className="profile-section-note">按身份展示</span></div>
              <div className="profile-fields-grid">{roleFields[role].map((field) => <Field key={field.key} label={field.label} value={roleValues[field.key] || ""} placeholder={field.placeholder} multiline={field.multiline} onChange={(value) => updateRole(field.key, value)} />)}</div>
            </section>

            {error ? <p className="profile-feedback error" role="alert">{error}</p> : null}
            {notice ? <p className="profile-feedback success" role="status">{notice}</p> : null}
            <div className="profile-actions"><button className="profile-save" type="submit" disabled={saving}>{saving ? "正在保存…" : "保存资料"}</button><Link href={getRoleHomePath(role)} className="profile-cancel">返回工作台</Link></div>
          </div>

          <aside className="profile-side">
            <section className="profile-side-panel"><span className="profile-section-kicker">ACCOUNT</span><h2>登录信息</h2><div className="profile-readonly"><span>登录邮箱</span><b>{email}</b></div><div className="profile-readonly"><span>注册身份</span><b>{roleLabels[role]}</b></div><div className="profile-readonly"><span>审核状态</span><b>{statusLabel(accountStatus)}</b></div></section>
            <section className="profile-side-panel profile-boundary"><span className="profile-section-kicker">PRIVACY BOUNDARY</span><h2>信息由你决定</h2><p>公开简介仅在你主动填写并通过平台审核后展示。BP 文件与联系方式不会因为保存资料自动公开。</p><div><span>主体资料</span><b>可控公开</b></div><div><span>完整 BP</span><b>授权可见</b></div><div><span>联系方式</span><b>申请后展示</b></div></section>
          </aside>
        </form>
      </div>
    </main>
  );
}
