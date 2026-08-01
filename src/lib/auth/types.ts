export const platformRoles = ["investor", "fa", "government", "project"] as const;

export type PlatformRole = (typeof platformRoles)[number];
export type AnyRole = PlatformRole | "admin";

export const roleLabels: Record<AnyRole, string> = {
  investor: "投资机构",
  fa: "FA",
  government: "政府招商",
  project: "项目方",
  admin: "平台管理",
};

export const roleDescriptions: Record<PlatformRole, string> = {
  investor: "发现项目 · 管理关注",
  fa: "连接资源 · 推荐项目",
  government: "产业招商 · 项目引进",
  project: "发布项目 · 获取融资",
};

export const roleHomePaths: Record<AnyRole, string> = {
  investor: "/workspace/investor",
  fa: "/workspace/fa",
  government: "/workspace/government",
  project: "/workspace/project",
  admin: "/admin",
};

export function isPlatformRole(value: string | null | undefined): value is PlatformRole {
  return Boolean(value && platformRoles.includes(value as PlatformRole));
}

export function getRoleHomePath(role: AnyRole) {
  return roleHomePaths[role];
}
