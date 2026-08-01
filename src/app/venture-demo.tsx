"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FloatingLines from "@/components/floating-lines";
import { getRoleHomePath, roleLabels, type AnyRole } from "@/lib/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type HomeAuthUser = {
  subjectName: string;
  role: AnyRole;
  roleLabel: string;
  homePath: string;
};

type ProfileSummary = {
  subject_name: string | null;
  role: string | null;
};

function toHomeAuthUser(user: User, profile: ProfileSummary | null): HomeAuthUser | null {
  if (!profile || !profile.role || !Object.prototype.hasOwnProperty.call(roleLabels, profile.role)) return null;

  const role = profile.role as AnyRole;
  return {
    subjectName: profile.subject_name || user.email || "已登录用户",
    role,
    roleLabel: roleLabels[role],
    homePath: getRoleHomePath(role),
  };
}

export type HomeProjectRecord = {
  id: string;
  name: string;
  company: string;
  summary: string;
  industry: string;
  stage: string;
  city: string;
  amount: number | null;
};

export type HomeInstitutionRecord = {
  id: string;
  name: string;
  role: string;
  location: string | null;
  logo_path: string | null;
};

export type PlatformMetrics = {
  projectCount: number | null;
  institutionCount: number | null;
  faCount: number | null;
  fundingAmount: number | null;
};

const emptyPlatformMetrics: PlatformMetrics = {
  projectCount: null,
  institutionCount: null,
  faCount: null,
  fundingAmount: null,
};

type ProjectStatus = "已通过";

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
    case "logout":
      return <svg {...common}><path d="M10 5H6v14h4" /><path d="M14 8l4 4-4 4" /><path d="M18 12H9" /></svg>;
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

function mapHomeProject(project: HomeProjectRecord): Project {
  return {
    ...project,
    amount: project.amount === null ? "待定" : `${project.amount} 万`,
    initials: project.name.slice(0, 1),
    accent: "#2478ee",
    status: "已通过",
  };
}

function formatMetric(value: number | null) {
  return value === null ? "—" : value.toLocaleString("zh-CN");
}

function formatFunding(value: number | null) {
  if (value === null) return "—";

  return `¥ ${(value / 10000).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 亿`;
}

const institutionRoleLabels: Record<string, string> = {
  investor: "投资机构",
  fa: "FA",
  government: "政府招商",
  project: "项目方",
};

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

export default function VentureDemo({
  initialAuthUser = null,
  initialProjects = [],
  initialMetrics = emptyPlatformMetrics,
  initialInstitutions = [],
}: {
  initialAuthUser?: HomeAuthUser | null;
  initialProjects?: HomeProjectRecord[];
  initialMetrics?: PlatformMetrics;
  initialInstitutions?: HomeInstitutionRecord[];
}) {
  const router = useRouter();
  const [searchTab, setSearchTab] = useState("找项目");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("全部行业");
  const [stage, setStage] = useState("全部阶段");
  const [city, setCity] = useState("全部城市");
  const [databaseProjects, setDatabaseProjects] = useState<Project[]>(() => initialProjects.map(mapHomeProject));
  const [platformMetrics] = useState<PlatformMetrics>(initialMetrics);
  const institutions = initialInstitutions;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationSeed);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<HomeAuthUser | null>(initialAuthUser);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [bpRequestSubmitting, setBpRequestSubmitting] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createSupabaseBrowserClient();
    let disposed = false;

    const syncAuthUser = async (user: User | null) => {
      if (!user) {
        if (!disposed) setAuthUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subject_name, role")
        .eq("id", user.id)
        .maybeSingle();
      const nextAuthUser = toHomeAuthUser(user, profile as ProfileSummary | null);

      if (!disposed) setAuthUser(nextAuthUser);
    };

    void supabase.auth.getSession().then(({ data: { session } }) => syncAuthUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void syncAuthUser(session?.user ?? null), 0);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setAuthMenuOpen(false);
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setAuthMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [authMenuOpen]);

  useEffect(() => {
    // Protected actions always start from the real auth flow. The public page
    // must never infer or switch a user's platform identity from a query string.
    void fetch("/api/projects").then(async (response) => response.ok ? response.json() : null).then((result) => {
      if (!Array.isArray(result?.projects)) return;
      setDatabaseProjects(result.projects.map(mapHomeProject));
    });
  }, []);

  const publicProjects = useMemo(
    () => databaseProjects.filter((project) => project.status === "已通过"),
    [databaseProjects],
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

  const industryTrends = useMemo(() => {
    const counts = new Map<string, number>();
    publicProjects.forEach((project) => counts.set(project.industry, (counts.get(project.industry) ?? 0) + 1));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] ?? 0;

    return sorted.slice(0, 4).map(([name, count]) => ({
      name,
      count,
      width: maxCount > 0 ? Math.max(24, Math.round((count / maxCount) * 100)) : 0,
    }));
  }, [publicProjects]);

  const featuredProject = publicProjects[0] ?? null;

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    setAuthMenuOpen(false);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setAuthUser(null);
      router.replace("/");
      router.refresh();
    } catch {
      setSigningOut(false);
      notify("退出登录失败，请稍后重试");
    }
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
  };

  const requestBpAccess = async () => {
    if (!selectedProject || bpRequestSubmitting) return;

    setBpRequestSubmitting(true);
    try {
      const response = await fetch("/api/bp-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          reason: `申请查看${selectedProject.name}的项目 BP，以便评估投资合作可能性。`,
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;

      if (!response.ok) {
        notify(result?.error || "BP 申请提交失败，请稍后重试");
        return;
      }

      setSelectedProject(null);
      notify("BP 查看申请已提交，请等待审核");
    } catch {
      notify("BP 申请提交失败，请稍后重试");
    } finally {
      setBpRequestSubmitting(false);
    }
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
            {authUser ? (
              <div className="auth-menu" ref={authMenuRef}>
                <button
                  className="role-button role-button-authenticated"
                  type="button"
                  aria-expanded={authMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="homepage-account-menu"
                  aria-label={`打开${authUser.roleLabel}账户菜单`}
                  onClick={() => setAuthMenuOpen((current) => !current)}
                >
                  <span className="role-button-copy"><b>{authUser.subjectName}</b><small>{authUser.roleLabel} · 个人中心</small></span>
                  <Icon name="chevron" size={13} />
                </button>
                {authMenuOpen && (
                  <div className="auth-menu-panel" id="homepage-account-menu" role="menu" aria-label="账户操作">
                    <Link className="auth-menu-item" href={authUser.homePath} role="menuitem" onClick={() => setAuthMenuOpen(false)}>
                      <Icon name="external" size={15} />
                      <span>进入个人中心</span>
                    </Link>
                    <button className="auth-menu-item auth-menu-item-danger" type="button" role="menuitem" onClick={() => void handleSignOut()} disabled={signingOut}>
                      <Icon name="logout" size={15} />
                      <span>{signingOut ? "正在退出…" : "退出登录"}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : <Link className="role-button" href="/login">登录 / 注册<Icon name="chevron" size={13} /></Link>}
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="market">
          <div className="hero-floating-lines"><FloatingLines /></div>
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">一个更高效的创投连接平台</p>
              <h1>让好项目<br /><span>与长期资本相遇</span></h1>
              <p className="hero-desc">投资机构、FA、政府招商部门与项目方，在这里发现彼此的下一步。</p>
              <div className="hero-rule" aria-hidden="true">
                <svg viewBox="0 0 92 18" focusable="false">
                  <path className="hero-wave-line" d="M1 9C8 1 16 1 23 9s15 8 23 0 15-8 23 0 15 8 22 0" />
                </svg>
              </div>
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
            <div className="metric"><span className="metric-icon"><Icon name="briefcase" size={19} /></span><div><strong>{formatMetric(platformMetrics.projectCount)}</strong><small>已公开项目</small></div></div>
            <div className="metric"><span className="metric-icon"><Icon name="building" size={19} /></span><div><strong>{formatMetric(platformMetrics.institutionCount)}</strong><small>已认证机构</small></div></div>
            <div className="metric"><span className="metric-icon"><Icon name="users" size={19} /></span><div><strong>{formatMetric(platformMetrics.faCount)}</strong><small>已认证 FA</small></div></div>
            <div className="metric"><span className="metric-icon"><Icon name="chart" size={19} /></span><div><strong>{formatFunding(platformMetrics.fundingAmount)}</strong><small>公开项目融资需求</small></div></div>
            <div className="metric metric-note"><div><strong>实时同步</strong><small>已审核公开数据</small></div><Icon name="arrow" size={18} /></div>
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
                  )) : <div className="empty-state"><Icon name="search" size={24} /><strong>{databaseProjects.length === 0 ? "暂无公开项目" : "没有匹配的项目"}</strong><span>{databaseProjects.length === 0 ? "项目审核通过后会在这里展示" : "试试更换行业、城市或搜索关键词"}</span></div>}
                </div>
              </section>

              <section className="feature-band">
                <div className="feature-copy"><span className="feature-label">FOR CAPITAL</span><h3>找到与你长期主义<br /><em>同频的项目</em></h3><p>用结构化信息，节省每一次项目判断的时间。</p><Link href={authUser?.homePath ?? "/login"}>进入我的工作台 <Icon name="arrow" size={15} /></Link></div>
                <div className="orbit-art"><span className="orbit orbit-a" /><span className="orbit orbit-b" /><span className="orbit-core">启</span><span className="art-tag art-tag-a">{featuredProject ? `${featuredProject.stage} · ${featuredProject.industry}` : "暂无公开项目"}</span><span className="art-tag art-tag-b">{featuredProject?.city ?? "等待审核"}</span><span className="art-tag art-tag-c">{featuredProject?.company ?? "等待公司入驻"}</span></div>
              </section>
            </div>

            <aside className="side-column">
              <section className="panel side-panel">
                <div className="panel-heading compact"><div><span className="section-kicker">TRENDING</span><h2>行业热度</h2></div><button className="tiny-more" onClick={() => notify("行业热度会持续根据平台项目更新")}>更多</button></div>
                <div className="trend-list">
                  {industryTrends.length > 0 ? industryTrends.map((trend, index) => (
                    <div key={trend.name}><span>{index + 1}</span><b>{trend.name}</b><i className="trend-bar" style={{ width: `${trend.width}%` }} /><em>{trend.count} 项</em></div>
                  )) : <div className="side-empty">暂无公开项目行业数据</div>}
                </div>
              </section>
              <section className="panel side-panel institution-panel">
                <div className="panel-heading compact"><div><span className="section-kicker">INSTITUTIONS</span><h2>已认证机构</h2></div><button className="tiny-more" onClick={() => notify("机构榜单将在主体入驻后持续更新")}>榜单</button></div>
                <div className="institution-list">
                  {institutions.length > 0 ? institutions.map((institution, index) => (
                    <div key={institution.id}>
                      <i className="rank">{String(index + 1).padStart(2, "0")}</i>
                      <span className={`institution-logo ${["blue-logo", "orange-logo", "purple-logo"][index] ?? "blue-logo"}`}>{institution.name.slice(0, 1)}</span>
                      <b>{institution.name}</b>
                      <small>{institutionRoleLabels[institution.role] ?? "已认证主体"}{institution.location ? ` · ${institution.location}` : ""}</small>
                    </div>
                  )) : <div className="side-empty">暂无已认证机构</div>}
                </div>
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



      {selectedProject && <div className="modal-backdrop" onMouseDown={() => setSelectedProject(null)}><section className="modal project-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedProject(null)}><Icon name="close" size={18} /></button><div className="detail-top"><i style={{ background: selectedProject.accent }}>{selectedProject.initials}</i><div><span className="section-kicker">PROJECT DETAIL</span><h2>{selectedProject.name}</h2><p>{selectedProject.company}</p></div><span className="detail-stage">{selectedProject.stage}</span></div><p className="detail-summary">{selectedProject.summary}</p><div className="detail-stats"><span><small>行业</small><b>{selectedProject.industry}</b></span><span><small>所在城市</small><b>{selectedProject.city}</b></span><span><small>计划融资</small><b>¥ {selectedProject.amount}</b></span></div><div className="detail-divider" /><div className="bp-row"><div><span className="bp-file-icon"><Icon name="file" size={18} /></span><div><b>项目商业计划书</b><small>完整 BP · 项目方授权后可查看</small></div></div>{authUser ? <button className="primary-action" type="button" onClick={() => void requestBpAccess()} disabled={bpRequestSubmitting}>{bpRequestSubmitting ? "提交中..." : "申请查看 BP"} <Icon name="arrow" size={15} /></button> : <Link className="primary-action" href="/login">登录后申请查看 BP <Icon name="arrow" size={15} /></Link>}</div></section></div>}



      {notificationsOpen && <div className="modal-backdrop" onMouseDown={() => setNotificationsOpen(false)}><section className="modal notification-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setNotificationsOpen(false)}><Icon name="close" size={18} /></button><span className="section-kicker">NOTIFICATIONS</span><h2>通知</h2><div className="notification-list">{notifications.map((notification) => <div className="notification-item" key={notification.id}><span className="notification-icon"><Icon name="bell" size={16} /></span><div><b>{notification.title}</b><p>{notification.detail}</p><small>{notification.time}</small></div></div>)}</div></section></div>}

      {toast && <div className="toast"><span className="toast-check"><Icon name="shield" size={15} /></span>{toast}</div>}
    </div>
  );
}
