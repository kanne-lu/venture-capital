import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const requestSchema = z.object({
  projectId: z.string().uuid(),
  reason: z.string().trim().min(10).max(1000),
});

function unavailable() {
  return NextResponse.json({ error: "Supabase 尚未配置。" }, { status: 503 });
}

export async function GET() {
  if (!isSupabaseConfigured()) return unavailable();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("bp_access_requests").select("id, project_id, requested_by, reason, status, created_at, reviewed_at, expires_at, projects(name, company)").order("created_at", { ascending: false }).limit(100);
  if (currentUser.profile.role !== "admin" && currentUser.profile.role !== "project") query = query.eq("requested_by", currentUser.profile.id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "BP 申请查询失败。" }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return unavailable();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  if (["project", "admin"].includes(currentUser.profile.role)) return NextResponse.json({ error: "当前身份不能发起 BP 查看申请。" }, { status: 403 });
  if (currentUser.profile.account_status !== "approved") return NextResponse.json({ error: "主体审核通过后才可以申请查看 BP。" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "请填写有效的项目和申请理由。" }, { status: 422 });

  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase.from("projects").select("id").eq("id", parsed.data.projectId).eq("status", "published").maybeSingle();
  if (!project) return NextResponse.json({ error: "项目不存在或尚未公开。" }, { status: 404 });

  const { data, error } = await supabase.from("bp_access_requests").insert({
    project_id: parsed.data.projectId,
    requested_by: currentUser.profile.id,
    reason: parsed.data.reason,
  }).select("id, project_id, status, reason, created_at").single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "你已经提交过该项目的待处理申请。" }, { status: 409 });
    return NextResponse.json({ error: error.message || "申请提交失败。" }, { status: 500 });
  }
  return NextResponse.json({ request: data }, { status: 201 });
}
