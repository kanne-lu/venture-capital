import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(20).max(1200),
  industry: z.string().trim().min(1).max(80),
  stage: z.string().trim().min(1).max(40),
  city: z.string().trim().min(1).max(80),
  amount: z.number().nonnegative().nullable().optional(),
});

function unavailable() {
  return NextResponse.json({ error: "Supabase 尚未配置。" }, { status: 503 });
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return unavailable();

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const industry = url.searchParams.get("industry");
  const stage = url.searchParams.get("stage");
  const city = url.searchParams.get("city");
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("projects").select("id, name, company, summary, industry, stage, city, amount, published_at").eq("status", "published").order("published_at", { ascending: false }).limit(50);

  if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,summary.ilike.%${search}%`);
  if (industry) query = query.eq("industry", industry);
  if (stage) query = query.eq("stage", stage);
  if (city) query = query.eq("city", city);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "项目查询失败。" }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return unavailable();

  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  if (currentUser.profile.role !== "project") return NextResponse.json({ error: "只有项目方可以提交项目。" }, { status: 403 });
  if (currentUser.profile.account_status !== "approved") return NextResponse.json({ error: "主体审核通过后才可以提交项目。" }, { status: 403 });
  if (!currentUser.organization) return NextResponse.json({ error: "当前账号还没有主体资料。" }, { status: 409 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "请完整填写项目资料。", details: parsed.error.flatten() }, { status: 422 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").insert({
    organization_id: currentUser.organization.id,
    name: parsed.data.name,
    company: parsed.data.company,
    summary: parsed.data.summary,
    industry: parsed.data.industry,
    stage: parsed.data.stage,
    city: parsed.data.city,
    amount: parsed.data.amount ?? null,
    status: "pending_review",
  }).select("*").single();

  if (error) return NextResponse.json({ error: error.message || "项目提交失败。" }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}
