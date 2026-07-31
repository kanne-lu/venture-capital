import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "平台介绍 · 启峰创投",
  description: "了解启峰创投如何连接投资机构、FA、政府招商部门与优质项目。",
};

type AboutIconName = "capital" | "fa" | "government" | "project" | "search" | "shield" | "arrow";

function AboutIcon({ name, size = 22 }: { name: AboutIconName; size?: number }) {
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
    case "capital":
      return <svg {...common}><path d="M4 20V5l8-2 8 2v15" /><path d="M8 8h1M8 12h1M8 16h1M15 8h1M15 12h1M15 16h1M3 20h18" /></svg>;
    case "fa":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3A4.5 4.5 0 0 1 15 18.5V20" /><path d="M15 5.5a3 3 0 0 1 0 5.8M17 14.3a4.5 4.5 0 0 1 4 4.2V20" /></svg>;
    case "government":
      return <svg {...common}><path d="m3 9 9-5 9 5" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M2 9h20" /></svg>;
    case "project":
      return <svg {...common}><rect x="3" y="6.5" width="18" height="13" rx="2" /><path d="M8 6.5V4h8v2.5M3 11h18M10 11v2h4v-2" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.2 4.2" /></svg>;
    case "shield":
      return <svg {...common}><path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
    default:
      return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
  }
}

const roles = [
  { icon: "capital" as const, number: "01", title: "投资机构", description: "找到与你的投资方向、阶段偏好和地域策略更匹配的项目。", action: "发现项目" },
  { icon: "fa" as const, number: "02", title: "FA / 顾问", description: "沉淀项目资源和服务能力，让每一次推荐都更高效。", action: "连接资源" },
  { icon: "government" as const, number: "03", title: "政府招商", description: "围绕产业方向寻找项目，把区域机会变成真实落地。", action: "发布需求" },
  { icon: "project" as const, number: "04", title: "项目方", description: "展示项目进展、上传 BP，获得更精准的资本与产业关注。", action: "提交项目" },
];

const workflow = [
  { number: "01", title: "发现", description: "公开项目市场持续更新，让值得关注的机会被看见。" },
  { number: "02", title: "判断", description: "通过行业、阶段、城市和融资需求，快速缩小匹配范围。" },
  { number: "03", title: "授权", description: "项目方审批 BP 查看申请，重要信息始终由项目方掌控。" },
  { number: "04", title: "推进", description: "围绕项目、资本和产业资源继续沟通，推动下一步发生。" },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="topbar about-topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/" aria-label="返回启峰创投首页">
            <img className="brand-logo" src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" />
          </Link>
          <nav className="main-nav about-nav" aria-label="主导航">
            <Link href="/#market" className="nav-link">项目市场</Link>
            <Link href="/#market" className="nav-link">投资机构 <span className="nav-arrow"><AboutIcon name="arrow" size={12} /></span></Link>
            <Link href="/#market" className="nav-link">FA 资源 <span className="nav-arrow"><AboutIcon name="arrow" size={12} /></span></Link>
            <Link href="/#market" className="nav-link">政府招商 <span className="nav-arrow"><AboutIcon name="arrow" size={12} /></span></Link>
            <Link href="/about" className="nav-link active">平台介绍</Link>
          </nav>
          <Link href="/login" className="about-enter-link">进入平台 <AboutIcon name="arrow" size={15} /></Link>
        </div>
      </header>

      <main>
        <section className="about-hero">
          <div className="about-shell about-hero-grid">
            <div className="about-hero-copy">
              <p className="about-eyebrow">ABOUT QIFENG CAPITAL</p>
              <h1>让每一次连接，<br /><span>都更有价值。</span></h1>
              <p className="about-hero-desc">启峰创投是一套面向产业与资本的项目连接平台，让投资机构、FA、政府招商部门和项目方，在同一个可信环境里找到彼此的下一步。</p>
              <div className="about-hero-actions">
                <Link href="/#market" className="about-primary-action">浏览项目市场 <AboutIcon name="arrow" size={16} /></Link>
                <a href="#roles" className="about-text-action">了解入驻角色 <AboutIcon name="arrow" size={15} /></a>
              </div>
              <div className="about-proof-row"><span><AboutIcon name="shield" size={16} />主体与项目审核</span><span><AboutIcon name="search" size={16} />结构化项目发现</span></div>
            </div>

            <div className="about-hero-visual" aria-label="平台连接四类角色的示意图">
              <div className="about-visual-top"><span>QIFENG NETWORK</span><b>01 — 04</b></div>
              <div className="about-network-art">
                <div className="about-network-ring ring-one" />
                <div className="about-network-ring ring-two" />
                <div className="about-network-core"><small>一个平台</small><strong>启峰<br />创投</strong></div>
                <span className="network-node node-capital"><i>资本</i><b>投资机构</b></span>
                <span className="network-node node-fa"><i>FA</i><b>资源顾问</b></span>
                <span className="network-node node-government"><i>政</i><b>招商部门</b></span>
                <span className="network-node node-project"><i>项</i><b>项目方</b></span>
              </div>
              <div className="about-visual-bottom"><span>DISCOVER · MATCH · MOVE</span><em>让好项目与长期资本相遇</em></div>
            </div>
          </div>
        </section>

        <section className="about-section about-role-section" id="roles">
          <div className="about-shell">
            <div className="about-section-heading"><div><p className="about-kicker">ONE PLATFORM, FOUR ROLES</p><h2>每一种角色，<br /><span>都有清晰的下一步。</span></h2></div><p>平台不替你做决定，只把重要的信息、合适的人和真实的机会，放到更近的位置。</p></div>
            <div className="about-role-grid">
              {roles.map((role) => <article className="about-role-card" key={role.title}><div className="about-role-card-top"><span className="about-role-icon"><AboutIcon name={role.icon} size={21} /></span><small>{role.number}</small></div><h3>{role.title}</h3><p>{role.description}</p><span className="about-role-action">{role.action}<AboutIcon name="arrow" size={14} /></span></article>)}
            </div>
          </div>
        </section>

        <section className="about-workflow-section" id="workflow">
          <div className="about-shell about-workflow-grid">
            <div className="about-workflow-copy"><p className="about-kicker">HOW IT WORKS</p><h2>从第一次发现，<br /><span>到真正推进。</span></h2><p>把项目连接拆成更清晰的四步，让每一次接触都有上下文，让每一次判断都更接近事实。</p><Link href="/#market" className="about-outline-action">去项目市场看看 <AboutIcon name="arrow" size={15} /></Link></div>
            <div className="about-process-list">{workflow.map((item, index) => <div className={`about-process-item ${index === 0 ? "current" : ""}`} key={item.number}><span className="about-process-number">{item.number}</span><div><h3>{item.title}</h3><p>{item.description}</p></div><AboutIcon name="arrow" size={16} /></div>)}</div>
          </div>
        </section>

        <section className="about-section about-trust-section">
          <div className="about-shell about-trust-grid">
            <div><p className="about-kicker">BUILT FOR TRUST</p><h2>重要信息，<br /><span>始终由合适的人掌控。</span></h2><p className="about-trust-intro">创投连接的效率，建立在信息边界清晰的基础上。启峰创投把公开展示与授权查看分开，让项目方更安心，让机构更高效。</p><div className="about-trust-points"><div><strong>01</strong><span>主体审核<br /><small>让真实的组织先被识别</small></span></div><div><strong>02</strong><span>BP 授权<br /><small>由项目方决定谁可以查看</small></span></div><div><strong>03</strong><span>持续更新<br /><small>让项目进展保持在场</small></span></div></div></div>
            <div className="about-safety-board"><div className="about-safety-head"><span><AboutIcon name="shield" size={18} />BP AUTHORIZATION</span><b>SECURE</b></div><div className="about-safety-main"><span className="about-safety-file"><AboutIcon name="project" size={24} /></span><div><strong>项目商业计划书</strong><small>完整 BP · 项目方授权后可查看</small></div></div><div className="about-safety-line"><span>查看申请</span><i /><b>项目方审批</b></div><div className="about-safety-foot"><span>权限状态</span><strong>仅对已授权成员开放</strong></div></div>
          </div>
        </section>

        <section className="about-cta-section"><div className="about-shell about-cta-inner"><div><p className="about-kicker">READY FOR THE NEXT MOVE?</p><h2>让下一次连接，<br /><span>发生在启峰。</span></h2></div><Link href="/login" className="about-cta-action">进入启峰创投 <AboutIcon name="arrow" size={16} /></Link></div></section>
      </main>

      <footer className="about-footer"><div className="about-shell"><div className="about-footer-main"><Link className="brand" href="/"><img className="brand-logo" src="/qifeng-capital-logo.png" alt="启峰创投" /></Link><p>连接项目、资本与产业，让长期价值更快相遇。</p><div className="about-footer-links"><Link href="/#market">项目市场</Link><Link href="/about">平台介绍</Link><Link href="/login">进入平台</Link></div></div><div className="about-footer-bottom"><span>© 2026 启峰创投 QIFENG CAPITAL</span><span>本地 Demo · 数据仅用于产品演示</span></div></div></footer>
    </div>
  );
}
