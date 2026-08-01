"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";

type ProjectStatus = "已通过" | "待审核";

type Project = {
  id: string;
  name: string;
  company: string;
  summary: string;
  industry: string;
  stage: string;
  city: string;
  amount: string;
  initials: string;
  accent: string;
  status: ProjectStatus;
};

const seedProjects: Project[] = [
  {
    id: "p-1",
    name: "星河智造",
    company: "苏州星河智能科技有限公司",
    summary: "面向柔性制造的工业视觉与智能调度平台，已服务 120+ 家工厂。",
    industry: "智能制造",
    stage: "A 轮",
    city: "苏州",
    amount: "3000 万",
    initials: "星",
    accent: "#2469e8",
    status: "已通过",
  },
  {
    id: "p-2",
    name: "碳寻科技",
    company: "深圳碳寻能源科技有限公司",
    summary: "用数字孪生技术帮助园区完成碳排监测、预测与节能决策。",
    industry: "绿色科技",
    stage: "Pre-A",
    city: "深圳",
    amount: "1500 万",
    initials: "碳",
    accent: "#16a47c",
    status: "已通过",
  },
  {
    id: "p-3",
    name: "澜途医疗",
    company: "杭州澜途医疗器械有限公司",
    summary: "下一代微创介入器械研发商，核心产品进入多家三甲医院临床验证。",
    industry: "医疗健康",
    stage: "B 轮",
    city: "杭州",
    amount: "8000 万",
    initials: "澜",
    accent: "#8a62e8",
    status: "已通过",
  },
  {
    id: "p-4",
    name: "云栈数据",
    company: "上海云栈数据服务有限公司",
    summary: "为制造企业提供低代码数据中台与 AI 经营分析工具。",
    industry: "企业服务",
    stage: "天使轮",
    city: "上海",
    amount: "800 万",
    initials: "云",
    accent: "#ef8a37",
    status: "已通过",
  },
  {
    id: "p-5",
    name: "禾木机器人",
    company: "无锡禾木机器人有限公司",
    summary: "专注仓储移动机器人的软硬件一体化方案，拥有自研导航算法。",
    industry: "机器人",
    stage: "A+ 轮",
    city: "无锡",
    amount: "5000 万",
    initials: "禾",
    accent: "#2478ee",
    status: "已通过",
  },
  {
    id: "p-6",
    name: "木棉消费",
    company: "广州木棉消费品牌管理有限公司",
    summary: "新一代功能型食品品牌，聚焦年轻家庭的日常营养场景。",
    industry: "消费零售",
    stage: "Pre-A",
    city: "广州",
    amount: "1200 万",
    initials: "木",
    accent: "#ef6b69",
    status: "已通过",
  },
];

const notificationSeed = [
  { id: "n-1", title: "欢迎来到启峰创投", detail: "你可以先浏览公开项目市场。", time: "刚刚", read: false },
  { id: "n-2", title: "平台审核机制已开启", detail: "公开项目均已通过基础审核。", time: "今天 09:20", read: true },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
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
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.2 4.2" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m7 9 5 5 5-5" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
    case "external":
      return <svg {...common}><path d="M14 5h5v5" /><path d="M19 5 11 13" /><path d="M18 13v5H6V6h5" /></svg>;
    case "briefcase":
      return <svg {...common}><rect x="3" y="6.5" width="18" height="13" rx="2" /><path d="M8 6.5V4h8v2.5M3 11h18M10 11v2h4v-2" /></svg>;
    case "building":
      return <svg {...common}><path d="M4 20V5l8-2 8 2v15" /><path d="M8 8h1M8 12h1M8 16h1M15 8h1M15 12h1M15 16h1M3 20h18" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3A4.5 4.5 0 0 1 15 18.5V20" /><path d="M15 5.5a3 3 0 0 1 0 5.8M17 14.3a4.5 4.5 0 0 1 4 4.2V20" /></svg>;
    case "chart":
      return <svg {...common}><path d="M4 19V5M4 19h17" /><path d="m7 15 3-3 3 2 5-6" /><path d="M17 8h1v1" /></svg>;
    case "shield":
      return <svg {...common}><path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "upload":
      return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></svg>;
    case "close":
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "file":
      return <svg {...common}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

function showAmount(amount: string) {
  return amount.replace(" 万", "");
}

type FilterDropdownProps = {
  id: string;
  label: string;
  ariaLabel?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  variant?: "filter" | "field";
};

function FilterDropdown({ id, label, ariaLabel, value, options, onChange, variant = "filter" }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(Math.max(options.indexOf(value), 0));
  const rootRef = useRef<HTMLDivElement>(null);
  const currentIndex = Math.max(options.indexOf(value), 0);
  const menuId = `${id}-options`;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const chooseOption = (nextValue: string) => {
    onChange(nextValue);
    setHighlightedIndex(Math.max(options.indexOf(nextValue), 0));
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (!open && ["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setHighlightedIndex(currentIndex);
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setHighlightedIndex((index) => (index + direction + options.length) % options.length);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(event.key === "Home" ? 0 : options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseOption(options[highlightedIndex]);
    }
  };

  return (
    <div id={id} className={`filter-control ${variant === "field" ? "field-control" : ""} ${open ? "is-open" : ""}`} ref={rootRef}>
      {label && <span className="filter-label">{label}</span>}
      <button
        type="button"
        className="filter-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={menuId}
        onClick={() => {
          setHighlightedIndex(currentIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{value}</span>
        <Icon name="chevron" size={13} />
      </button>
      {open && (
        <div className="filter-menu" id={menuId} role="listbox" aria-label={`${ariaLabel || label}筛选`}>
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={value === option}
              className={`filter-option ${value === option ? "selected" : ""} ${highlightedIndex === index ? "highlighted" : ""}`}
              key={option}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => chooseOption(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VentureDemo() {
  const [searchTab, setSearchTab] = useState("找项目");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("全部行业");
  const [stage, setStage] = useState("全部阶段");
  const [city, setCity] = useState("全部城市");
  const [databaseProjects, setDatabaseProjects] = useState<Project[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationSeed);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Protected actions always start from the real auth flow. The public page
    // must never infer or switch a user's platform identity from a query string.
    void fetch("/api/projects").then(async (response) => response.ok ? response.json() : null).then((result) => {
      if (!result?.projects) return;
      setDatabaseProjects(result.projects.map((project: { id: string; name: string; company: string; summary: string; industry: string; stage: string; city: string; amount: number | null }) => ({
        id: project.id,
        name: project.name,
        company: project.company,
        summary: project.summary,
        industry: project.industry,
        stage: project.stage,
        city: project.city,
        amount: project.amount === null ? "待定" : `${project.amount} 万`,
        initials: project.name.slice(0, 1),
        accent: "#2478ee",
        status: "已通过",
      })));
    });
  }, []);

  const allProjects = useMemo(() => databaseProjects.length > 0 ? databaseProjects : seedProjects, [databaseProjects]);
  const publicProjects = useMemo(
    () => allProjects.filter((project) => project.status === "已通过"),
    [allProjects],
  );
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return publicProjects.filter((project) => {
      const matchesQuery = !normalizedQuery || [project.name, project.company, project.summary, project.industry].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesIndustry = industry === "全部行业" || project.industry === industry;
      const matchesStage = stage === "全部阶段" || project.stage === stage;
      const matchesCity = city === "全部城市" || project.city === city;
      return matchesQuery && matchesIndustry && matchesStage && matchesCity;
    });
  }, [city, industry, publicProjects, query, stage]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
  };

  return (
    <div className="venture-app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/#market" aria-label="返回启峰创投首页">
            <img className="brand-logo" src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" />
          </Link>
          <nav className="main-nav" aria-label="主导航">
            <Link href="/#market" className="nav-link active">项目市场</Link>
            <Link href="/login" className="nav-link">投资机构<span className="nav-arrow"><Icon name="chevron" size={12} /></span></Link>
            <Link href="/login" className="nav-link">FA 资源<span className="nav-arrow"><Icon name="chevron" size={12} /></span></Link>
            <Link href="/login" className="nav-link">政府招商<span className="nav-arrow"><Icon name="chevron" size={12} /></span></Link>
            <Link href="/about" className="nav-link">平台介绍</Link>
          </nav>
          <div className="header-actions">
            <label className="mini-search">
              <span className="sr-only">搜索平台</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索项目、机构或行业" />
              <Icon name="search" size={16} />
            </label>
            <button className="header-link notification-trigger" onClick={() => { setNotificationsOpen(true); setNotifications((current) => current.map((item) => ({ ...item, read: true }))); }} aria-label="查看通知">
              <Icon name="bell" size={18} />{unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
            </button>
            <Link className="role-button" href="/login">登录 / 注册<Icon name="chevron" size={13} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="market">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">一个更高效的创投连接平台</p>
              <h1>让好项目<br /><span>与长期资本相遇</span></h1>
              <p className="hero-desc">投资机构、FA、政府招商部门与项目方，在这里发现彼此的下一步。</p>
              <div className="hero-rule" />
              <div className="hero-proof"><span><Icon name="shield" size={16} />真实主体审核</span><span><Icon name="chart" size={16} />项目持续更新</span></div>
            </div>
            <div className="search-stage">
              <div className="search-tabs" role="tablist" aria-label="搜索类型">
                {["找项目", "找机构", "找 FA", "找招商"].map((tab) => (
                  <button key={tab} className={`search-tab ${searchTab === tab ? "selected" : ""}`} onClick={() => setSearchTab(tab)}>{tab}</button>
                ))}
              </div>
              <div className="search-box">
                <Icon name="search" size={20} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchTab === "找项目" ? "搜索项目名称、行业或公司" : `搜索${searchTab.replace("找", "")}`} />
                <button onClick={() => document.getElementById("project-list")?.scrollIntoView({ behavior: "smooth" })}>搜索</button>
              </div>
              <div className="hot-search"><span>热门搜索</span><button onClick={() => setQuery("智能制造")}>智能制造</button><button onClick={() => setQuery("医疗健康")}>医疗健康</button><button onClick={() => setQuery("苏州")}>苏州项目</button></div>
            </div>
          </div>
        </section>

        <section className="metrics-strip" aria-label="平台数据概览">
          <div className="metrics-inner">
            <div className="metric"><span className="metric-icon"><Icon name="briefcase" size={19} /></span><div><strong>12,846</strong><small>平台项目</small></div></div>
            <div className="metric"><span className="metric-icon"><Icon name="building" size={19} /></span><div><strong>3,280</strong><small>入驻机构</small></div></div>
            <div className="metric"><span className="metric-icon"><Icon name="users" size={19} /></span><div><strong>486</strong><small>FA 顾问</small></div></div>
            <div className="metric"><span className="metric-icon"><Icon name="chart" size={19} /></span><div><strong>¥ 386 亿</strong><small>累计融资金额</small></div></div>
            <div className="metric metric-note"><div><strong>每日更新</strong><small>平台项目与资本动态</small></div><Icon name="arrow" size={18} /></div>
          </div>
        </section>

        <section className="content-wrap">
          <div className="content-grid">
            <div className="main-column">
              <section className="panel project-panel" id="project-list">
                <div className="panel-heading">
                  <div><span className="section-kicker">MARKETPLACE</span><h2>最新项目</h2></div>
                  <button className="more-link" onClick={() => setQuery("")}>查看全部 <Icon name="arrow" size={15} /></button>
                </div>
                <div className="filter-row">
                  <FilterDropdown id="industry-filter" label="行业" value={industry} options={["全部行业", "智能制造", "绿色科技", "医疗健康", "企业服务", "机器人", "消费零售"]} onChange={setIndustry} />
                  <FilterDropdown id="stage-filter" label="阶段" value={stage} options={["全部阶段", "天使轮", "Pre-A", "A 轮", "A+ 轮", "B 轮"]} onChange={setStage} />
                  <FilterDropdown id="city-filter" label="城市" value={city} options={["全部城市", "苏州", "深圳", "杭州", "上海", "无锡", "广州"]} onChange={setCity} />
                  <span className="filter-result">共 {filteredProjects.length} 个项目</span>
                </div>
                <div className="project-table" role="table" aria-label="最新项目列表">
                  <div className="table-row table-head" role="row"><span>项目 / 公司</span><span>行业</span><span>阶段</span><span>城市</span><span>融资需求</span><span /></div>
                  {filteredProjects.length > 0 ? filteredProjects.map((project) => (
                    <button className="table-row table-body" key={project.id} onClick={() => openProject(project)} role="row">
                      <span className="project-name"><i style={{ background: project.accent }}>{project.initials}</i><b>{project.name}</b><small>{project.company}</small></span>
                      <span className="muted-cell">{project.industry}</span><span className="stage-cell">{project.stage}</span><span className="muted-cell">{project.city}</span><span className="amount-cell">¥ {showAmount(project.amount)}<small> 万</small></span><Icon name="arrow" size={16} />
                    </button>
                  )) : <div className="empty-state"><Icon name="search" size={24} /><strong>没有匹配的项目</strong><span>试试更换行业、城市或搜索关键词</span></div>}
                </div>
              </section>

              <section className="feature-band">
                <div className="feature-copy"><span className="feature-label">FOR CAPITAL</span><h3>找到与你长期主义<br /><em>同频的项目</em></h3><p>用结构化信息，节省每一次项目判断的时间。</p><Link href="/login">进入我的工作台 <Icon name="arrow" size={15} /></Link></div>
                <div className="orbit-art"><span className="orbit orbit-a" /><span className="orbit orbit-b" /><span className="orbit-core">优</span><span className="art-tag art-tag-a">A 轮 · 36 项</span><span className="art-tag art-tag-b">新能源</span></div>
              </section>
            </div>

            <aside className="side-column">
              <section className="panel side-panel">
                <div className="panel-heading compact"><div><span className="section-kicker">TRENDING</span><h2>行业热度</h2></div><button className="tiny-more" onClick={() => notify("行业热度会持续根据平台项目更新")}>更多</button></div>
                <div className="trend-list"><div><span>1</span><b>智能制造</b><i className="trend-bar" style={{ width: "88%" }} /><em>+28%</em></div><div><span>2</span><b>医疗健康</b><i className="trend-bar" style={{ width: "73%" }} /><em>+21%</em></div><div><span>3</span><b>绿色科技</b><i className="trend-bar" style={{ width: "64%" }} /><em>+18%</em></div><div><span>4</span><b>企业服务</b><i className="trend-bar" style={{ width: "52%" }} /><em>+12%</em></div></div>
              </section>
              <section className="panel side-panel institution-panel">
                <div className="panel-heading compact"><div><span className="section-kicker">INSTITUTIONS</span><h2>活跃机构</h2></div><button className="tiny-more" onClick={() => notify("机构榜单将在主体入驻后持续更新")}>榜单</button></div>
                <div className="institution-list"><div><i className="rank">01</i><span className="institution-logo blue-logo">启</span><b>启明创投</b><small>本周关注 28 项</small></div><div><i className="rank">02</i><span className="institution-logo orange-logo">元</span><b>元禾控股</b><small>本周关注 21 项</small></div><div><i className="rank">03</i><span className="institution-logo purple-logo">经</span><b>经纬创投</b><small>本周关注 18 项</small></div></div>
              </section>
              <section className="side-callout"><div className="callout-icon"><Icon name="users" size={19} /></div><div><strong>我是项目方</strong><span>发布项目，连接资本与资源</span></div><Link href="/login">发布项目 <Icon name="arrow" size={14} /></Link></section>
            </aside>
          </div>
        </section>

        <section className="content-wrap content-section">
          <div className="section-heading-row"><div><span className="section-kicker">INSIGHT</span><h2>创投观察</h2></div><button className="more-link" onClick={() => notify("研究内容会在平台内容中心持续更新")}>更多内容 <Icon name="arrow" size={15} /></button></div>
          <div className="insight-grid"><article className="insight-card insight-main"><div className="insight-visual gradient-blue"><span>资本</span><strong>产业升级的<br />下一站在哪里？</strong><i>01</i></div><div className="insight-meta"><span>趋势洞察</span><b>从项目热度看产业投资的新方向</b><small>2026.07.28 · 启峰创投研究院</small></div></article><article className="insight-card"><div className="mini-visual gradient-orange"><span>方法论</span><strong>投资人如何<br />建立第一印象</strong><i>02</i></div><div className="insight-meta"><span>投资方法</span><b>一份项目初筛清单</b><small>2026.07.25 · 8 分钟阅读</small></div></article><article className="insight-card"><div className="mini-visual gradient-purple"><span>区域观察</span><strong>长三角<br />硬科技地图</strong><i>03</i></div><div className="insight-meta"><span>区域研究</span><b>制造业新势力正在发生</b><small>2026.07.21 · 12 分钟阅读</small></div></article></div>
        </section>
      </main>

      <footer className="footer"><div className="footer-inner"><div className="footer-brand"><img className="footer-logo" src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" /><p>让好项目与长期资本相遇。</p></div><div className="footer-links"><div><b>平台服务</b><a href="#market">项目市场</a><a href="#market">机构入驻</a><a href="#market">FA 资源</a></div><div><b>关于启峰创投</b><a href="#market">平台介绍</a><a href="#market">审核机制</a><a href="#market">联系我们</a></div><div><b>帮助中心</b><a href="#market">使用指南</a><a href="#market">隐私政策</a><a href="#market">服务条款</a></div></div></div><div className="footer-bottom"><span>© 2026 启峰创投 Qifeng Capital</span><span>主体审核 · 信息授权 · 全程留痕</span></div></footer>



      {selectedProject && <div className="modal-backdrop" onMouseDown={() => setSelectedProject(null)}><section className="modal project-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedProject(null)}><Icon name="close" size={18} /></button><div className="detail-top"><i style={{ background: selectedProject.accent }}>{selectedProject.initials}</i><div><span className="section-kicker">PROJECT DETAIL</span><h2>{selectedProject.name}</h2><p>{selectedProject.company}</p></div><span className="detail-stage">{selectedProject.stage}</span></div><p className="detail-summary">{selectedProject.summary}</p><div className="detail-stats"><span><small>行业</small><b>{selectedProject.industry}</b></span><span><small>所在城市</small><b>{selectedProject.city}</b></span><span><small>计划融资</small><b>¥ {selectedProject.amount}</b></span></div><div className="detail-divider" /><div className="bp-row"><div><span className="bp-file-icon"><Icon name="file" size={18} /></span><div><b>项目商业计划书</b><small>完整 BP · 项目方授权后可查看</small></div></div><Link className="primary-action" href="/login">登录后申请查看 BP <Icon name="arrow" size={15} /></Link></div></section></div>}



      {notificationsOpen && <div className="modal-backdrop" onMouseDown={() => setNotificationsOpen(false)}><section className="modal notification-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setNotificationsOpen(false)}><Icon name="close" size={18} /></button><span className="section-kicker">NOTIFICATIONS</span><h2>通知</h2><div className="notification-list">{notifications.map((notification) => <div className="notification-item" key={notification.id}><span className="notification-icon"><Icon name="bell" size={16} /></span><div><b>{notification.title}</b><p>{notification.detail}</p><small>{notification.time}</small></div></div>)}</div></section></div>}

      {toast && <div className="toast"><span className="toast-check"><Icon name="shield" size={15} /></span>{toast}</div>}
    </div>
  );
}
