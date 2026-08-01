import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const reviewSchema = z.object({
  resourceType: z.enum(["profile", "project", "bp_request", "report", "content"]),
  resourceId: z.string().uuid(),
  status: z.string().min(1),
  reason: z.string().trim().max(1000).optional().default(""),
});

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase 尚未配置。" }, { status: 503 });

  const admin = await requireAdmin();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "审核参数不完整。" }, { status: 422 });

  const { resourceType, resourceId, status, reason } = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (resourceType === "profile") {
    if (!["approved", "rejected", "suspended"].includes(status)) return NextResponse.json({ error: "主体状态无效。" }, { status: 422 });
    const profileResult = await supabase.from("profiles").update({
      account_status: status,
      approval_reason: reason || null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      approved_by: status === "approved" ? admin.profile.id : null,
    }).eq("id", resourceId).select("id, account_status, approval_reason").single();
    if (profileResult.error) return NextResponse.json({ error: profileResult.error.message || "主体审核失败。" }, { status: 500 });

    const verificationStatus = status === "approved" ? "verified" : status === "rejected" ? "rejected" : "unsubmitted";
    await supabase.from("organizations").update({ verification_status: verificationStatus, verification_reason: reason || null }).eq("owner_user_id", resourceId);
    return NextResponse.json({ item: profileResult.data });
  }

  if (resourceType === "project") {
    if (!["published", "revision_requested", "rejected", "archived"].includes(status)) return NextResponse.json({ error: "项目状态无效。" }, { status: 422 });
    const projectResult = await supabase.from("projects").update({
      status,
      review_reason: reason || null,
      reviewed_by: admin.profile.id,
      reviewed_at: new Date().toISOString(),
      published_at: status === "published" ? new Date().toISOString() : null,
    }).eq("id", resourceId).select("id, status, review_reason, published_at").single();
    if (projectResult.error) return NextResponse.json({ error: projectResult.error.message || "项目审核失败。" }, { status: 500 });
    return NextResponse.json({ item: projectResult.data });
  }

  if (resourceType === "bp_request") {
    if (!["approved", "rejected"].includes(status)) return NextResponse.json({ error: "BP 申请状态无效。" }, { status: 422 });
    const requestResult = await supabase.from("bp_access_requests").update({
      status,
      reviewed_by: admin.profile.id,
      reviewed_at: new Date().toISOString(),
      expires_at: status === "approved" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    }).eq("id", resourceId).eq("status", "pending").select("id, status, reviewed_at, expires_at").single();
    if (requestResult.error) return NextResponse.json({ error: requestResult.error.message || "BP 申请处理失败。" }, { status: 500 });
    return NextResponse.json({ item: requestResult.data });
  }

  if (resourceType === "report") {
    if (!["reviewing", "resolved", "dismissed"].includes(status)) return NextResponse.json({ error: "举报状态无效。" }, { status: 422 });
    const reportResult = await supabase.from("reports").update({ status, resolution: reason || null, reviewed_by: admin.profile.id, reviewed_at: new Date().toISOString() }).eq("id", resourceId).select("id, status, resolution").single();
    if (reportResult.error) return NextResponse.json({ error: reportResult.error.message || "举报处理失败。" }, { status: 500 });
    return NextResponse.json({ item: reportResult.data });
  }

  if (!["published", "archived", "draft"].includes(status)) return NextResponse.json({ error: "内容状态无效。" }, { status: 422 });
  const contentResult = await supabase.from("content_entries").update({ status, updated_by: admin.profile.id, published_at: status === "published" ? new Date().toISOString() : null }).eq("id", resourceId).select("id, status, published_at").single();
  if (contentResult.error) return NextResponse.json({ error: contentResult.error.message || "内容更新失败。" }, { status: 500 });
  return NextResponse.json({ item: contentResult.data });
}
