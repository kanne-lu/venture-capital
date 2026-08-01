import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./current-user";
import { getRoleHomePath, type AnyRole, type PlatformRole } from "./types";

export async function requireUser(): Promise<CurrentUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?reason=auth-required");
  }

  return currentUser;
}

export async function requirePlatformRole(role: PlatformRole) {
  const currentUser = await requireUser();

  if (currentUser.profile.role !== role) {
    redirect(getRoleHomePath(currentUser.profile.role as AnyRole));
  }

  return currentUser;
}

export async function requireAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login?reason=auth-required");
  }

  if (currentUser.profile.role === "admin" && currentUser.profile.admin_role) {
    return currentUser;
  }

  if (currentUser.profile.role === "admin") {
    redirect("/login?reason=admin-not-enabled");
  }

  redirect(getRoleHomePath(currentUser.profile.role as AnyRole));
}
