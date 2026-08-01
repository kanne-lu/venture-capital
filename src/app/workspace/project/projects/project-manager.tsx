"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProjectManagerProject } from "./page";

type FormValues = {
  name: string;
  company: string;
  summary: string;
  industry: string;
  stage: string;
  city: string;
  amount: string;
};

type AccessRequest = {
  id: string;
  project_id: string;
  requested_by: string;
  reason: string;
  status: string;
  created_at: string;
  projects?: { name: string; company: string } | null;
};

const initialForm: FormValues = { name: "", company: "", summary: "", industry: "智能制造", stage: "天使轮", city: "苏州", amount: "" };

function statusLabel(status: string) {
  if (status === "published") return "已公开";
  if (status === "pending_review") return "审核中";
  if (status === "revision_requested") return "需要修改";
  if (status === "rejected") return "未通过";
  return "草稿";
}

function statusClass(status: string) {
  return status.replaceAll("_", "-");
}

export default function ProjectManager({ subjectName, accountStatus, projects: initialProjects }: { subjectName: string; accountStatus: string; projects: ProjectManagerProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetch("/api/bp-requests").then(async (response) => response.ok ? response.json() : null).then((result) => {
      if (result?.requests) setRequests(result.requests as AccessRequest[]);
    });
  }, []);

  const updateForm = (key: keyof FormValues, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const submitProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: form.amount.trim() ? Number(form.amount) : null }) });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(result.error || "项目提交失败，请稍后再试。");
      return;
    }
    setProjects((current) => [result.project, ...current]);
    setForm(initialForm);
    setNotice("项目已提交，等待平台审核。 ");
  };

  const uploadBp = async (projectId: string, file: File | undefined) => {
    if (!file) return;
    setError("");
    setNotice("");
    setUploadingId(projectId);
    const payload = new FormData();
    payload.set("file", file);
    const response = await fetch(`/api/projects/${projectId}/bp`, { method: "POST", body: payload });
    const result = await response.json().catch(() => ({}));
    setUploadingId(null);
    if (!response.ok) {
      setError(result.error || "BP 上传失败，请稍后再试。");
      return;
    }
    setNotice(`${result.asset?.original_name ?? "BP"} 已上传为第 ${result.asset?.version ?? ""} 个版本。`);
  };

  const decideRequest = async (requestId: string, status: "approved" | "rejected") => {
    setError("");
    setNotice("");
    const response = await fetch(`/api/bp-requests/${requestId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error || "BP 申请处理失败。");
      return;
    }
    setRequests((current) => current.map((item) => item.id === requestId ? { ...item, status } : item));
    setNotice(status === "approved" ? "已批准 BP 查看申请。" : "已拒绝 BP 查看申请。 ");
  };

  return (
    <main className="workspace-page workspace-project">
      <div className="project-manager-shell">
        <header className="workspace-topbar"><Link className="workspace-brand" href="/"><img src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" /></Link><nav className="workspace-nav" aria-label="项目方导航"><Link href="/workspace/project">个人中心</Link><Link href="/workspace/project/projects" className="active">我的项目</Link><Link href="/profile">资料设置</Link></nav><div className="workspace-account"><span>{subjectName}</span><Link href="/">返回前台</Link></div></header>
        <section className="project-manager-heading"><div><span className="workspace-kicker">PROJECT PIPELINE</span><h1>管理你的项目与 BP</h1><p>一个账号可以管理多个项目。每次提交都会进入平台审核，BP 始终保存在私有空间。</p></div><span className="project-manager-status">{accountStatus === "approved" ? "主体已审核" : "主体待审核"}</span></section>

        {accountStatus !== "approved" ? <div className="project-manager-notice">主体审核通过后才可以提交项目和上传 BP。你可以先完善 <Link href="/profile">主体资料</Link>。</div> : null}
        {error ? <p className="project-manager-feedback error" role="alert">{error}</p> : null}
        {notice ? <p className="project-manager-feedback success" role="status">{notice}</p> : null}

        <div className="project-manager-grid">
          <section className="project-manager-form-panel"><div className="project-panel-heading"><div><span className="workspace-label">NEW PROJECT</span><h2>提交一个新项目</h2></div><span className="project-panel-step">01 / 02</span></div><form className="project-create-form" onSubmit={submitProject}><label>项目名称<input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="例如：星河智造" /></label><label>公司名称<input required value={form.company} onChange={(event) => updateForm("company", event.target.value)} placeholder="请输入公司全称" /></label><label className="project-field-wide">项目简介<textarea required minLength={20} rows={5} value={form.summary} onChange={(event) => updateForm("summary", event.target.value)} placeholder="用一段话说明产品、客户、进展和融资目的" /></label><label>行业<select value={form.industry} onChange={(event) => updateForm("industry", event.target.value)}><option>智能制造</option><option>医疗健康</option><option>绿色科技</option><option>企业服务</option><option>机器人</option><option>消费零售</option></select></label><label>融资阶段<select value={form.stage} onChange={(event) => updateForm("stage", event.target.value)}><option>天使轮</option><option>Pre-A</option><option>A 轮</option><option>A+ 轮</option><option>B 轮</option></select></label><label>所在城市<input required value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="例如：苏州" /></label><label>计划融资（万元）<input inputMode="decimal" value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} placeholder="例如：1500" /></label><button className="project-submit" type="submit" disabled={saving || accountStatus !== "approved"}>{saving ? "正在提交…" : "提交平台审核"}</button></form></section>

          <section className="project-list-panel"><div className="project-panel-heading"><div><span className="workspace-label">YOUR PROJECTS</span><h2>我的项目</h2></div><span className="project-count">{projects.length} 个</span></div>{projects.length === 0 ? <div className="project-empty"><strong>还没有提交项目</strong><span>提交后，项目会在这里显示审核状态。</span></div> : <div className="managed-project-list">{projects.map((project) => <article className="managed-project" key={project.id}><div className="managed-project-top"><div><h3>{project.name}</h3><span>{project.company} · {project.city}</span></div><b className={`managed-project-status status-${statusClass(project.status)}`}>{statusLabel(project.status)}</b></div><p>{project.summary}</p><div className="managed-project-meta"><span>{project.industry}</span><span>{project.stage}</span><span>{project.amount ? `¥ ${project.amount} 万` : "融资金额待补充"}</span></div><div className="managed-project-actions"><label className={`bp-upload-trigger ${uploadingId === project.id ? "is-uploading" : ""}`}><input type="file" accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" disabled={uploadingId === project.id || accountStatus !== "approved"} onChange={(event) => void uploadBp(project.id, event.target.files?.[0])} />{uploadingId === project.id ? "正在上传…" : "上传 / 更新 BP"}</label><span>PDF / PPT / PPTX · 最大 50MB</span></div>{project.review_reason ? <small className="managed-project-reason">平台意见：{project.review_reason}</small> : null}</article>)}</div>}<div className="project-access-section"><div className="project-panel-heading"><div><span className="workspace-label">BP REQUESTS</span><h2>待处理申请</h2></div><span className="project-count">{requests.filter((item) => item.status === "pending").length} 条待处理</span></div>{requests.length === 0 ? <div className="project-access-empty">目前没有 BP 查看申请。</div> : <div className="project-request-list">{requests.map((item) => <article className="project-request-item" key={item.id}><div><b>{item.projects?.name ?? `项目 ${item.project_id}`}</b><span>申请人 {item.requested_by.slice(0, 8)} · {item.status === "pending" ? "待处理" : item.status === "approved" ? "已批准" : "已拒绝"}</span></div><p>{item.reason}</p>{item.status === "pending" ? <div className="project-request-actions"><button type="button" onClick={() => void decideRequest(item.id, "approved")}>批准查看</button><button type="button" onClick={() => void decideRequest(item.id, "rejected")}>拒绝申请</button></div> : null}</article>)}</div>}</div></section>
        </div>
      </div>
    </main>
  );
}
