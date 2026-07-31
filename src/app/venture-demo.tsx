"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

type Role = "访客" | "投资机构" | "FA" | "政府招商" | "项目方";
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

type AccessRequest = {
  project: Project;
  reason: string;
  applicant: string;
};

type PublishForm = {
  title: string;
  company: string;
  industry: string;
  city: string;
  stage: string;
  amount: string;
  summary: string;
};

const roles: Role[] = ["投资机构", "FA", "政府招商", "项目方"];

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
  const [activeNav, setActiveNav] = useState("项目市场");
  const [searchTab, setSearchTab] = useState("找项目");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("全部行业");
  const [stage, setStage] = useState("全部阶段");
  const [city, setCity] = useState("全部城市");
  const [selectedRole, setSelectedRole] = useState<Role>("访客");
  const [rolePanelOpen, setRolePanelOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [requestProject, setRequestProject] = useState<Project | null>(null);
  const [requestReason, setRequestReason] = useState("希望进一步了解项目团队与商业化进展。");
  const [pendingRequest, setPendingRequest] = useState<AccessRequest | null>(null);
  const [authorizedProjects, setAuthorizedProjects] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(notificationSeed);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [bpFile, setBpFile] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [customProjects, setCustomProjects] = useState<Project[]>([]);
  const [publishForm, setPublishForm] = useState<PublishForm>({
    title: "",
    company: "",
    industry: "智能制造",
    city: "苏州",
    stage: "天使轮",
    amount: "",
    summary: "",
  });

  const allProjects = useMemo(() => [...customProjects, ...seedProjects], [customProjects]);
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
  const currentRoleLabel = selectedRole === "访客" ? "选择身份" : selectedRole;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  const appendNotification = (title: string, detail: string) => {
    setNotifications((current) => [
      { id: `n-${Date.now()}`, title, detail, time: "刚刚", read: false },
      ...current,
    ]);
  };

  const chooseRole = (role: Role) => {
    setSelectedRole(role);
    setRolePanelOpen(false);
    if (role === "项目方") setWorkspaceOpen(true);
    notify(role === "访客" ? "已切换为访客浏览模式" : `已切换为${role}身份`);
  };

  const requestAccess = (project: Project) => {
    if (selectedRole === "访客") {
      setRolePanelOpen(true);
      notify("请先选择投资机构、FA 或政府招商身份");
      return;
    }
    setRequestProject(project);
    setRequestReason("希望进一步了解项目团队与商业化进展。");
  };

  const submitRequest = () => {
    if (!requestProject) return;
    setPendingRequest({ project: requestProject, reason: requestReason, applicant: selectedRole });
    appendNotification("BP 查看申请已提交", `你已向 ${requestProject.name} 发起查看申请。`);
    setRequestProject(null);
    notify("申请已提交，等待项目方审批");
  };

  const approveRequest = () => {
    if (!pendingRequest) return;
    setAuthorizedProjects((current) => [...new Set([...current, pendingRequest.project.id])]);
    appendNotification("BP 查看申请已通过", `${pendingRequest.project.name} 已向你开放 BP。`);
    setPendingRequest(null);
    notify("已批准申请，现在可以查看 BP");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validType = /\.(pdf|pptx?)$/i.test(file.name);
    if (!validType) {
      notify("仅支持 PDF、PPT、PPTX 文件");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      notify("单个 BP 文件不能超过 50MB");
      return;
    }
    setBpFile(file.name);
    notify("BP 已选择，Demo 中将保存到本地会话");
  };

  const publishProject = () => {
    if (!publishForm.title.trim() || !publishForm.company.trim() || !publishForm.summary.trim()) {
      notify("请先填写项目名称、公司名称和项目简介");
      return;
    }
    const project: Project = {
      id: `custom-${Date.now()}`,
      name: publishForm.title,
      company: publishForm.company,
      summary: publishForm.summary,
      industry: publishForm.industry,
      stage: publishForm.stage,
      city: publishForm.city,
      amount: publishForm.amount ? `${publishForm.amount} 万` : "待定",
      initials: publishForm.title.slice(0, 1),
      accent: "#2469e8",
      status: "待审核",
    };
    setCustomProjects((current) => [project, ...current]);
    setPublishOpen(false);
    setWorkspaceOpen(true);
    appendNotification("项目已提交审核", `${project.name} 已进入平台审核队列。`);
    notify("项目已提交，审核通过后会出现在公开市场");
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
  };

  return (
    <div className="venture-app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => { setActiveNav("项目市场"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="返回启峰创投首页">
            <img className="brand-logo" src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" />
          </button>
          <nav className="main-nav" aria-label="主导航">
            {["项目市场", "投资机构", "FA 资源", "政府招商"].map((item) => (
              <button key={item} className={`nav-link ${activeNav === item ? "active" : ""}`} onClick={() => { setActiveNav(item); notify(`${item}模块 Demo 即将展开`); }}>
                {item}{item !== "项目市场" && <span className="nav-arrow"><Icon name="chevron" size={12} /></span>}
              </button>
            ))}
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
            <button className="role-button" onClick={() => setRolePanelOpen(true)}>{currentRoleLabel}<Icon name="chevron" size={13} /></button>
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
                <div className="feature-copy"><span className="feature-label">FOR CAPITAL</span><h3>找到与你长期主义<br /><em>同频的项目</em></h3><p>用结构化信息，节省每一次项目判断的时间。</p><button onClick={() => setRolePanelOpen(true)}>进入我的工作台 <Icon name="arrow" size={15} /></button></div>
                <div className="orbit-art"><span className="orbit orbit-a" /><span className="orbit orbit-b" /><span className="orbit-core">优</span><span className="art-tag art-tag-a">A 轮 · 36 项</span><span className="art-tag art-tag-b">新能源</span></div>
              </section>
            </div>

            <aside className="side-column">
              <section className="panel side-panel">
                <div className="panel-heading compact"><div><span className="section-kicker">TRENDING</span><h2>行业热度</h2></div><button className="tiny-more" onClick={() => notify("行业趋势 Demo 即将展开")}>更多</button></div>
                <div className="trend-list"><div><span>1</span><b>智能制造</b><i className="trend-bar" style={{ width: "88%" }} /><em>+28%</em></div><div><span>2</span><b>医疗健康</b><i className="trend-bar" style={{ width: "73%" }} /><em>+21%</em></div><div><span>3</span><b>绿色科技</b><i className="trend-bar" style={{ width: "64%" }} /><em>+18%</em></div><div><span>4</span><b>企业服务</b><i className="trend-bar" style={{ width: "52%" }} /><em>+12%</em></div></div>
              </section>
              <section className="panel side-panel institution-panel">
                <div className="panel-heading compact"><div><span className="section-kicker">INSTITUTIONS</span><h2>活跃机构</h2></div><button className="tiny-more" onClick={() => notify("机构榜单 Demo 即将展开")}>榜单</button></div>
                <div className="institution-list"><div><i className="rank">01</i><span className="institution-logo blue-logo">启</span><b>启明创投</b><small>本周关注 28 项</small></div><div><i className="rank">02</i><span className="institution-logo orange-logo">元</span><b>元禾控股</b><small>本周关注 21 项</small></div><div><i className="rank">03</i><span className="institution-logo purple-logo">经</span><b>经纬创投</b><small>本周关注 18 项</small></div></div>
              </section>
              <section className="side-callout"><div className="callout-icon"><Icon name="users" size={19} /></div><div><strong>我是项目方</strong><span>发布项目，连接资本与资源</span></div><button onClick={() => { setSelectedRole("项目方"); setWorkspaceOpen(true); }}>发布项目 <Icon name="arrow" size={14} /></button></section>
            </aside>
          </div>
        </section>

        <section className="content-wrap content-section">
          <div className="section-heading-row"><div><span className="section-kicker">INSIGHT</span><h2>创投观察</h2></div><button className="more-link" onClick={() => notify("创投观察内容 Demo 即将展开")}>更多内容 <Icon name="arrow" size={15} /></button></div>
          <div className="insight-grid"><article className="insight-card insight-main"><div className="insight-visual gradient-blue"><span>资本</span><strong>产业升级的<br />下一站在哪里？</strong><i>01</i></div><div className="insight-meta"><span>趋势洞察</span><b>从项目热度看产业投资的新方向</b><small>2026.07.28 · 启峰创投研究院</small></div></article><article className="insight-card"><div className="mini-visual gradient-orange"><span>方法论</span><strong>投资人如何<br />建立第一印象</strong><i>02</i></div><div className="insight-meta"><span>投资方法</span><b>一份项目初筛清单</b><small>2026.07.25 · 8 分钟阅读</small></div></article><article className="insight-card"><div className="mini-visual gradient-purple"><span>区域观察</span><strong>长三角<br />硬科技地图</strong><i>03</i></div><div className="insight-meta"><span>区域研究</span><b>制造业新势力正在发生</b><small>2026.07.21 · 12 分钟阅读</small></div></article></div>
        </section>
      </main>

      <footer className="footer"><div className="footer-inner"><div className="footer-brand"><img className="footer-logo" src="/qifeng-capital-logo.png" alt="启峰创投 QIFENG CAPITAL" /><p>让好项目与长期资本相遇。</p></div><div className="footer-links"><div><b>平台服务</b><a href="#market">项目市场</a><a href="#market">机构入驻</a><a href="#market">FA 资源</a></div><div><b>关于启峰创投</b><a href="#market">平台介绍</a><a href="#market">审核机制</a><a href="#market">联系我们</a></div><div><b>帮助中心</b><a href="#market">使用指南</a><a href="#market">隐私政策</a><a href="#market">服务条款</a></div></div></div><div className="footer-bottom"><span>© 2026 启峰创投 Qifeng Capital Demo</span><span>本地演示版本 · 数据仅供展示</span></div></footer>

      {rolePanelOpen && <div className="modal-backdrop nested-backdrop" onMouseDown={() => setRolePanelOpen(false)}><section className="modal role-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setRolePanelOpen(false)}><Icon name="close" size={18} /></button><span className="section-kicker">CHOOSE YOUR ROLE</span><h2>你想以什么身份进入启峰创投？</h2><p>不同身份会进入对应工作台， Demo 中可以随时切换。</p><div className="role-grid">{roles.map((role) => <button key={role} className={`role-card ${selectedRole === role ? "selected" : ""}`} onClick={() => chooseRole(role)}><span className="role-card-icon"><Icon name={role === "投资机构" ? "building" : role === "FA" ? "users" : role === "政府招商" ? "chart" : "briefcase"} size={20} /></span><b>{role}</b><small>{role === "投资机构" ? "发现项目 · 管理关注" : role === "FA" ? "连接资源 · 推荐项目" : role === "政府招商" ? "产业招商 · 项目引进" : "发布项目 · 获取融资"}</small></button>)}</div><button className="guest-link" onClick={() => chooseRole("访客")}>继续浏览公开市场</button></section></div>}

      {requestProject && <div className="modal-backdrop nested-backdrop" onMouseDown={() => setRequestProject(null)}><section className="modal request-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setRequestProject(null)}><Icon name="close" size={18} /></button><span className="section-kicker">REQUEST BP ACCESS</span><h2>申请查看项目 BP</h2><div className="request-project"><i style={{ background: requestProject.accent }}>{requestProject.initials}</i><div><b>{requestProject.name}</b><span>{requestProject.company}</span></div></div><label className="field-label">申请理由<textarea value={requestReason} onChange={(event) => setRequestReason(event.target.value)} rows={4} /></label><div className="privacy-note"><Icon name="shield" size={17} /><span>项目方审批通过后，你才能查看或下载完整 BP。</span></div><button className="primary-action full" onClick={submitRequest}>提交申请 <Icon name="arrow" size={16} /></button></section></div>}

      {selectedProject && <div className="modal-backdrop" onMouseDown={() => setSelectedProject(null)}><section className="modal project-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedProject(null)}><Icon name="close" size={18} /></button><div className="detail-top"><i style={{ background: selectedProject.accent }}>{selectedProject.initials}</i><div><span className="section-kicker">PROJECT DETAIL</span><h2>{selectedProject.name}</h2><p>{selectedProject.company}</p></div><span className="detail-stage">{selectedProject.stage}</span></div><p className="detail-summary">{selectedProject.summary}</p><div className="detail-stats"><span><small>行业</small><b>{selectedProject.industry}</b></span><span><small>所在城市</small><b>{selectedProject.city}</b></span><span><small>计划融资</small><b>¥ {selectedProject.amount}</b></span></div><div className="detail-divider" /><div className="bp-row"><div><span className="bp-file-icon"><Icon name="file" size={18} /></span><div><b>项目商业计划书</b><small>完整 BP · 项目方授权后可查看</small></div></div>{authorizedProjects.includes(selectedProject.id) ? <button className="authorized-button" onClick={() => notify("Demo 中 BP 已授权，可进行本地预览")}>已获授权 <Icon name="shield" size={15} /></button> : <button className="primary-action" onClick={() => requestAccess(selectedProject)}>申请查看 BP <Icon name="arrow" size={15} /></button>}</div></section></div>}

      {workspaceOpen && <div className="modal-backdrop" onMouseDown={() => setWorkspaceOpen(false)}><section className="modal workspace-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setWorkspaceOpen(false)}><Icon name="close" size={18} /></button><div className="workspace-head"><div><span className="section-kicker">WORKSPACE</span><h2>{selectedRole === "项目方" ? "项目方工作台" : `${selectedRole}工作台`}</h2><p>本地 Demo · 数据仅保存在当前会话</p></div><button className="secondary-action" onClick={() => setPublishOpen(true)}>发布项目 <Icon name="arrow" size={15} /></button></div>{selectedRole === "项目方" ? <div className="workspace-grid"><div className="workspace-card approval-card"><span className="workspace-label">待处理申请</span>{pendingRequest ? <><div className="approval-person"><i>{pendingRequest.applicant.slice(0, 1)}</i><div><b>{pendingRequest.applicant}申请查看 {pendingRequest.project.name}</b><small>{pendingRequest.reason}</small></div></div><div className="approval-actions"><button className="secondary-action" onClick={() => { setPendingRequest(null); notify("已拒绝这次 BP 查看申请"); }}>拒绝</button><button className="primary-action" onClick={approveRequest}>批准查看 <Icon name="shield" size={15} /></button></div></> : <div className="workspace-empty"><Icon name="shield" size={24} /><b>暂时没有待处理申请</b><span>新的查看申请会出现在这里</span></div>}</div><div className="workspace-card"><span className="workspace-label">我的项目</span><div className="workspace-project-number"><strong>{customProjects.length}</strong><span>个项目已提交</span></div><button className="workspace-link" onClick={() => setPublishOpen(true)}>继续发布项目 <Icon name="arrow" size={14} /></button></div><div className="workspace-card upload-card"><span className="workspace-label">BP 文件</span><div className="upload-box"><span className="bp-file-icon"><Icon name="upload" size={18} /></span><div><b>{bpFile || "上传当前版本 BP"}</b><small>支持 PDF / PPT / PPTX，最大 50MB</small></div><label className="upload-button"><input type="file" accept=".pdf,.ppt,.pptx" onChange={handleFileChange} /><Icon name="upload" size={16} /></label></div></div></div> : <div className="workspace-grid"><div className="workspace-card"><span className="workspace-label">我的关注</span><div className="workspace-project-number"><strong>18</strong><span>个项目正在跟进</span></div><button className="workspace-link" onClick={() => setWorkspaceOpen(false)}>回到项目市场 <Icon name="arrow" size={14} /></button></div><div className="workspace-card"><span className="workspace-label">本周推荐</span><div className="workspace-project-number"><strong>6</strong><span>个新项目匹配方向</span></div><button className="workspace-link" onClick={() => { setWorkspaceOpen(false); document.getElementById("project-list")?.scrollIntoView({ behavior: "smooth" }); }}>查看推荐 <Icon name="arrow" size={14} /></button></div><div className="workspace-card"><span className="workspace-label">BP 授权</span><div className="workspace-project-number"><strong>{authorizedProjects.length}</strong><span>个项目已开放 BP</span></div><button className="workspace-link" onClick={() => notify("授权项目会在这里持续更新")}>查看授权 <Icon name="arrow" size={14} /></button></div></div>}</section></div>}

      {publishOpen && <div className="modal-backdrop nested-backdrop" onMouseDown={() => setPublishOpen(false)}><section className="modal publish-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setPublishOpen(false)}><Icon name="close" size={18} /></button><span className="section-kicker">PUBLISH PROJECT</span><h2>发布一个新项目</h2><p>提交后将进入平台审核，审核通过后公开展示。</p><div className="publish-form"><label className="field-label">项目名称<input value={publishForm.title} onChange={(event) => setPublishForm({ ...publishForm, title: event.target.value })} placeholder="例如：星河智造" /></label><label className="field-label">公司名称<input value={publishForm.company} onChange={(event) => setPublishForm({ ...publishForm, company: event.target.value })} placeholder="请输入公司全称" /></label><div className="form-row"><div className="field-label">行业<FilterDropdown id="publish-industry" ariaLabel="行业" label="" variant="field" value={publishForm.industry} options={["智能制造", "医疗健康", "绿色科技", "企业服务", "机器人", "消费零售"]} onChange={(value) => setPublishForm({ ...publishForm, industry: value })} /></div><div className="field-label">城市<FilterDropdown id="publish-city" ariaLabel="城市" label="" variant="field" value={publishForm.city} options={["苏州", "上海", "深圳", "杭州", "广州"]} onChange={(value) => setPublishForm({ ...publishForm, city: value })} /></div></div><div className="form-row"><div className="field-label">融资阶段<FilterDropdown id="publish-stage" ariaLabel="融资阶段" label="" variant="field" value={publishForm.stage} options={["天使轮", "Pre-A", "A 轮", "B 轮"]} onChange={(value) => setPublishForm({ ...publishForm, stage: value })} /></div><label className="field-label">计划融资（万元）<input value={publishForm.amount} onChange={(event) => setPublishForm({ ...publishForm, amount: event.target.value })} placeholder="例如：1500" /></label></div><label className="field-label">项目简介<textarea value={publishForm.summary} onChange={(event) => setPublishForm({ ...publishForm, summary: event.target.value })} rows={4} placeholder="用一两句话介绍项目的产品、客户和进展" /></label><label className="upload-box publish-upload"><span className="bp-file-icon"><Icon name="file" size={18} /></span><div><b>{bpFile || "上传 BP（可选）"}</b><small>PDF / PPT / PPTX，单文件最大 50MB</small></div><label className="upload-button"><input type="file" accept=".pdf,.ppt,.pptx" onChange={handleFileChange} /><Icon name="upload" size={16} /></label></label></div><button className="primary-action full" onClick={publishProject}>提交平台审核 <Icon name="arrow" size={16} /></button></section></div>}

      {notificationsOpen && <div className="modal-backdrop" onMouseDown={() => setNotificationsOpen(false)}><section className="modal notification-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setNotificationsOpen(false)}><Icon name="close" size={18} /></button><span className="section-kicker">NOTIFICATIONS</span><h2>通知</h2><div className="notification-list">{notifications.map((notification) => <div className="notification-item" key={notification.id}><span className="notification-icon"><Icon name="bell" size={16} /></span><div><b>{notification.title}</b><p>{notification.detail}</p><small>{notification.time}</small></div></div>)}</div></section></div>}

      {toast && <div className="toast"><span className="toast-check"><Icon name="shield" size={15} /></span>{toast}</div>}
    </div>
  );
}
