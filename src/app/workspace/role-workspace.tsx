import Link from "next/link";
import type { CurrentUser } from "@/lib/auth/current-user";
import { roleDescriptions, roleLabels, type PlatformRole } from "@/lib/auth/types";
import SignOutButton from "./sign-out-button";

const roleDetails: Record<PlatformRole, { eyebrow: string; title: string; intro: string; stats: Array<[string, string]>; actions: Array<[string, string]> }> = {
  investor: {
    eyebrow: "CAPITAL WORKSPACE",
    title: "把关注，变成有节奏的判断",
    intro: "管理你的投资偏好、项目池与尽调节奏，让每一次跟进都更清晰。",
    stats: [["18", "正在关注"], ["06", "本周匹配"], ["03", "BP 已授权"]],
    actions: [["设置投资偏好", "从行业、阶段和区域开始建立筛选条件。"], ["查看项目管线", "把公开项目放入你的内部跟进流程。"], ["查看合作申请", "处理来自项目方和 FA 的正式对接。"]],
  },
  fa: {
    eyebrow: "FA WORKSPACE",
    title: "让每一次推荐，都更有分量",
    intro: "展示你的服务能力，管理项目推荐和合作申请，建立可追踪的资源连接。",
    stats: [["12", "服务项目"], ["08", "推荐进行中"], ["05", "合作申请"]],
    actions: [["完善服务资料", "让投资机构和项目方快速了解你的优势。"], ["管理项目推荐", "只在获得项目方授权后发起推荐。"], ["查看合作申请", "跟进项目、机构和政府招商的服务需求。"]],
  },
  government: {
    eyebrow: "INDUSTRY WORKSPACE",
    title: "让产业机会，被合适的项目看见",
    intro: "发布区域产业方向、招商机会和政策支持，持续管理项目落地对接。",
    stats: [["04", "招商机会"], ["16", "项目申请"], ["07", "重点产业"]],
    actions: [["完善招商资料", "公开区域、产业和政策支持信息。"], ["发布招商机会", "创建经过审核后公开的产业需求。"], ["处理落地申请", "筛选项目并更新招商对接状态。"]],
  },
  project: {
    eyebrow: "PROJECT WORKSPACE",
    title: "把项目进展，交给真正的长期伙伴",
    intro: "管理公司资料、多个项目和 BP 版本，掌控每一次信息授权。",
    stats: [["02", "管理项目"], ["04", "BP 版本"], ["09", "合作申请"]],
    actions: [["完善公司资料", "补充团队、产品和主体认证信息。"], ["管理我的项目", "创建项目草稿并提交平台审核。"], ["处理 BP 申请", "由你决定谁可以查看完整 BP。"]],
  },
};

function statusLabel(status: CurrentUser["profile"]["account_status"]) {
  if (status === "approved") return "主体审核已通过";
  if (status === "rejected") return "资料需要修改";
  if (status === "suspended") return "账号暂时停用";
  if (status === "pending_email") return "等待邮箱验证";
  return "主体资料审核中";
}

export default function RoleWorkspace({ role, currentUser }: { role: PlatformRole; currentUser: CurrentUser }) {
  const detail = roleDetails[role];
  const status = currentUser.profile.account_status;

  return (
    <main className={`workspace-page workspace-${role}`}>
      <div className="workspace-shell">
        <header className="workspace-topbar">
          <Link className="workspace-brand" href="/">
            <img src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" />
          </Link>
          <nav className="workspace-nav" aria-label="个人中心导航">
            <Link href={`/workspace/${role}`} className="active">个人中心</Link>
            {role === "project" && <Link href="/workspace/project/projects">我的项目</Link>}
            <Link href="/">项目市场</Link>
            <Link href="/about">平台介绍</Link>
          </nav>
          <div className="workspace-account"><span>{currentUser.profile.subject_name}</span><SignOutButton /></div>
        </header>

        <section className="workspace-hero">
          <div className="workspace-hero-copy">
            <span className="workspace-kicker">{detail.eyebrow}</span>
            <h1>{detail.title}</h1>
            <p>{detail.intro}</p>
            <div className="workspace-identity"><span className="workspace-avatar">{currentUser.profile.subject_name.slice(0, 1)}</span><span><b>{currentUser.profile.subject_name}</b><small>{roleLabels[role]} · {roleDescriptions[role]}</small></span></div>
          </div>
          <div className="workspace-orbit-art" aria-hidden="true"><span className="workspace-orbit orbit-one" /><span className="workspace-orbit orbit-two" /><strong>{role === "project" ? "项" : role === "government" ? "政" : role === "fa" ? "FA" : "资"}</strong><i>{statusLabel(status)}</i></div>
        </section>

        <section className={`workspace-status-card status-${status}`}>
          <div><span className="workspace-label">ACCOUNT STATUS</span><h2>{statusLabel(status)}</h2><p>{status === "approved" ? "你的身份权限已开启，可以开始管理平台业务。" : "完成资料和资质审核后，平台会开放对应身份的完整功能。"}</p></div>
          <Link href="/profile" className="workspace-outline-action">查看并完善资料</Link>
        </section>

        <section className="workspace-stat-row" aria-label="工作台概览">
          {detail.stats.map(([value, label]) => <div className="workspace-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </section>

        <section className="workspace-content-grid">
          <div className="workspace-main-panel">
            <div className="workspace-section-heading"><div><span className="workspace-label">YOUR NEXT MOVES</span><h2>从这里开始</h2></div><span className="workspace-role-mark">{roleLabels[role]}</span></div>
            <div className="workspace-action-list">
              {detail.actions.map(([title, description], index) => <Link href={role === "project" && index === 1 ? "/workspace/project/projects" : "/profile"} className="workspace-action-item" key={title}><span className="workspace-action-number">0{index + 1}</span><span><b>{title}</b><small>{description}</small></span><em>→</em></Link>)}
            </div>
          </div>
          <aside className="workspace-side-panel">
            <span className="workspace-label">TRUST & BOUNDARY</span>
            <h2>重要信息，由你掌控</h2>
            <p>公开资料和私有 BP 分开管理。合作申请被接受前，平台不会展示你的联系方式。</p>
            <div className="workspace-boundary-line"><span>主体资料</span><b>可控公开</b></div>
            <div className="workspace-boundary-line"><span>完整 BP</span><b>授权可见</b></div>
            <div className="workspace-boundary-line"><span>联系方式</span><b>申请后展示</b></div>
          </aside>
        </section>
      </div>
    </main>
  );
}
