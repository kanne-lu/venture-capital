import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const decisionSchema = z.object({ status: z.enum(["approved", "rejected"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase 尚未配置。" }, { status: 503 });
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  if (currentUser.profile.role !== "project" && currentUser.profile.role !== "admin") return NextResponse.json({ error: "只有项目方或管理员可以处理 BP 申请。" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "无效的申请处理状态。" }, { status: 422 });

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("bp_access_requests").update({
    status: parsed.data.status,
    reviewed_by: currentUser.profile.id,
    reviewed_at: new Date().toISOString(),
    expires_at: parsed.data.status === "approved" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
  }).eq("id", id).eq("status", "pending").select("id, project_id, requested_by, status, reviewed_at, expires_at").single();

  if (error) return NextResponse.json({ error: error.message || "申请处理失败。" }, { status: 500 });
  return NextResponse.json({ request: data });
}
