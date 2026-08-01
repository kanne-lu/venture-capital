"use client";

import Link from "next/link";
import { useState } from "react";

type AdminModuleKey = "users" | "projects" | "bp" | "reports" | "content" | "audit";

function value(row: Record<string, unknown>, key: string) {
  const current = row[key];
  if (current === null || current === undefined || current === "") return "未填写";
  if (typeof current === "object") return JSON.stringify(current);
  return String(current);
}

const actionMap: Record<AdminModuleKey, Array<{ label: string; status: string; tone: "primary" | "danger" | "muted" }>> = {
  users: [{ label: "通过主体", status: "approved", tone: "primary" }, { label: "退回修改", status: "rejected", tone: "danger" }],
  projects: [{ label: "发布项目", status: "published", tone: "primary" }, { label: "要求修改", status: "revision_requested", tone: "muted" }, { label: "不通过", status: "rejected", tone: "danger" }],
  bp: [{ label: "批准申请", status: "approved", tone: "primary" }, { label: "拒绝申请", status: "rejected", tone: "danger" }],
  reports: [{ label: "标记处理中", status: "reviewing", tone: "muted" }, { label: "已解决", status: "resolved", tone: "primary" }, { label: "驳回举报", status: "dismissed", tone: "danger" }],
  content: [{ label: "发布内容", status: "published", tone: "primary" }, { label: "归档", status: "archived", tone: "muted" }],
  audit: [],
};

function titleFor(moduleKey: AdminModuleKey, row: Record<string, unknown>) {
  if (moduleKey === "users") return value(row, "subject_name");
  if (moduleKey === "projects") return value(row, "name");
  if (moduleKey === "content") return value(row, "title");
  if (moduleKey === "reports") return value(row, "reason");
  if (moduleKey === "bp") return `项目 ${value(row, "project_id")}`;
  return value(row, "action");
}

export default function AdminModule({ moduleKey, moduleLabel, adminName, adminRole, rows: initialRows }: { moduleKey: AdminModuleKey; moduleLabel: string; adminName: string; adminRole: "super_admin" | "reviewer" | null; rows: Record<string, unknown>[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const review = async (row: Record<string, unknown>, status: string) => {
    const resourceType = moduleKey === "users" ? "profile" : moduleKey === "projects" ? "project" : moduleKey === "bp" ? "bp_request" : moduleKey === "reports" ? "report" : "content";
    const id = String(row.id);
    setBusyId(id);
    setError("");
    const response = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resourceType, resourceId: id, status, reason }) });
    const result = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setError(result.error || "操作失败，请稍后重试。");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id || (moduleKey === "content" && status !== "archived")));
    setReason("");
  };

  const navItems: Array<[string, string, boolean]> = [["总览", "/admin", false], ["主体审核", "/admin/users", moduleKey === "users"], ["项目审核", "/admin/projects", moduleKey === "projects"], ["BP 与授权", "/admin/bp", moduleKey === "bp"], ["举报处理", "/admin/reports", moduleKey === "reports"]];
  if (adminRole === "super_admin") {
    navItems.push(["平台内容", "/admin/content", moduleKey === "content"], ["操作审计", "/admin/audit", moduleKey === "audit"]);
  }

  return (
    <main className="admin-page"><div className="admin-shell"><header className="admin-topbar"><div><span className="admin-brand-kicker">QIFENG CAPITAL · OPERATIONS</span><h1>运营管理后台</h1></div><div className="admin-account"><span>{adminName}</span><Link href="/">返回前台</Link></div></header><div className="admin-layout"><aside className="admin-sidebar"><div className="admin-side-title">WORKSPACE</div><nav>{navItems.map(([label, href, active]) => <Link href={href} key={href} className={active ? "active" : ""}><i>{label === "总览" ? "O" : label.slice(0, 1)}</i>{label}</Link>)}</nav></aside><section className="admin-main"><div className="admin-module-heading"><div><span className="admin-kicker">{moduleKey.toUpperCase()}</span><h2>{moduleLabel}</h2><p>这里只显示需要运营动作的记录，所有变更都会经过服务端权限校验。</p></div><span className="admin-module-count">{rows.length} 条</span></div>{error ? <p className="admin-module-feedback" role="alert">{error}</p> : null}{moduleKey !== "audit" ? <div className="admin-review-list">{rows.length === 0 ? <div className="admin-module-empty"><strong>当前没有待处理记录</strong><span>新的数据进入审核队列后会显示在这里。</span></div> : rows.map((row) => <article className="admin-review-item" key={String(row.id)}><div className="admin-review-top"><div><span className="admin-review-type">{moduleLabel}</span><h3>{titleFor(moduleKey, row)}</h3></div><small>{value(row, "created_at")}</small></div><p>{moduleKey === "users" ? `${value(row, "role")} · 联系人 ${value(row, "contact_name")} · ${value(row, "phone")}` : moduleKey === "projects" ? `${value(row, "company")} · ${value(row, "industry")} · ${value(row, "stage")} · ${value(row, "city")}` : moduleKey === "bp" ? value(row, "reason") : moduleKey === "reports" ? `${value(row, "detail")} · 关联项目 ${value(row, "project_id")}` : moduleKey === "content" ? `${value(row, "content_type")} · ${value(row, "slug")} · ${value(row, "status")}` : value(row, "metadata")}</p><textarea className="admin-review-reason" rows={2} placeholder="可选：填写审核意见" value={reason} onChange={(event) => setReason(event.target.value)} /><div className="admin-review-actions">{actionMap[moduleKey].map((action) => <button key={action.status} className={`admin-review-button ${action.tone}`} type="button" disabled={busyId === String(row.id)} onClick={() => void review(row, action.status)}>{busyId === String(row.id) ? "处理中…" : action.label}</button>)}</div></article>)}</div> : <div className="admin-audit-list">{rows.map((row) => <div key={String(row.id)} className="admin-audit-item"><span>{value(row, "created_at")}</span><b>{value(row, "action")}</b><small>{value(row, "resource_type")} · {value(row, "resource_id")}</small></div>)}</div>}</section></div></div></main>
  );
}
