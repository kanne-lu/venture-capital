import VentureDemo from "./venture-demo";
import type { HomeInstitutionRecord, HomeProjectRecord, PlatformMetrics } from "./venture-demo";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRoleHomePath, roleLabels } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const emptyPlatformMetrics: PlatformMetrics = {
  projectCount: null,
  institutionCount: null,
  faCount: null,
  fundingAmount: null,
};

async function getHomeData(): Promise<{
  projects: HomeProjectRecord[];
  institutions: HomeInstitutionRecord[];
  metrics: PlatformMetrics;
}> {
  if (!isSupabaseConfigured()) {
    return { projects: [], institutions: [], metrics: emptyPlatformMetrics };
  }

  const supabase = await createSupabaseServerClient();
  const [projectsResult, projectCountResult, institutionCountResult, faCountResult, fundingResult, institutionsResult] = await Promise.all([
    supabase.from("projects").select("id, name, company, summary, industry, stage, city, amount").eq("status", "published").order("published_at", { ascending: false }).limit(50),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("verification_status", "verified").in("role", ["investor", "fa", "government"]),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("verification_status", "verified").eq("role", "fa"),
    supabase.from("projects").select("amount").eq("status", "published"),
    supabase.from("organizations").select("id, name, role, location, logo_path").eq("verification_status", "verified").in("role", ["investor", "fa", "government"]).order("created_at", { ascending: false }).limit(3),
  ]);

  return {
    projects: (projectsResult.data ?? []) as HomeProjectRecord[],
    institutions: (institutionsResult.data ?? []) as HomeInstitutionRecord[],
    metrics: {
      projectCount: projectCountResult.error ? null : projectCountResult.count ?? 0,
      institutionCount: institutionCountResult.error ? null : institutionCountResult.count ?? 0,
      faCount: faCountResult.error ? null : faCountResult.count ?? 0,
      fundingAmount: fundingResult.error ? null : (fundingResult.data ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0),
    },
  };
}

export default async function Home() {
  const [currentUser, homeData] = await Promise.all([getCurrentUser(), getHomeData()]);
  const role = currentUser?.profile.role;

  return (
    <VentureDemo
      initialAuthUser={currentUser && role ? {
        subjectName: currentUser.profile.subject_name,
        role,
        roleLabel: roleLabels[role],
        homePath: getRoleHomePath(role),
      } : null}
      initialProjects={homeData.projects}
      initialInstitutions={homeData.institutions}
      initialMetrics={homeData.metrics}
    />
  );
}
