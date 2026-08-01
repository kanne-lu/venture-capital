import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const maxFileSize = 50 * 1024 * 1024;
const mimeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function unavailable() {
  return NextResponse.json({ error: "Supabase 尚未配置。" }, { status: 503 });
}

function fileExtension(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return unavailable();

  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  if (currentUser.profile.role !== "project" || currentUser.profile.account_status !== "approved") return NextResponse.json({ error: "只有审核通过的项目方可以上传 BP。" }, { status: 403 });
  if (!currentUser.organization) return NextResponse.json({ error: "当前账号还没有主体资料。" }, { status: 409 });

  const { id: projectId } = await params;
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "请选择一个 BP 文件。" }, { status: 400 });
  if (file.size <= 0 || file.size > maxFileSize) return NextResponse.json({ error: "BP 文件必须大于 0 且不超过 50MB。" }, { status: 422 });

  const extension = fileExtension(file.name);
  const mimeType = mimeByExtension[extension];
  if (!mimeType) return NextResponse.json({ error: "仅支持 PDF、PPT、PPTX 文件。" }, { status: 422 });

  const supabase = await createSupabaseServerClient();
  const { data: project, error: projectError } = await supabase.from("projects").select("id").eq("id", projectId).eq("organization_id", currentUser.organization.id).maybeSingle();
  if (projectError || !project) return NextResponse.json({ error: "项目不存在或无权上传。" }, { status: 404 });

  const { data: latest } = await supabase.from("bp_assets").select("version").eq("project_id", projectId).order("version", { ascending: false }).limit(1).maybeSingle();
  const version = (latest?.version ?? 0) + 1;
  const storagePath = `${projectId}/${crypto.randomUUID()}.${extension}`;
  const uploadResult = await supabase.storage.from("bp-private").upload(storagePath, await file.arrayBuffer(), { contentType: mimeType, upsert: false });
  if (uploadResult.error) return NextResponse.json({ error: uploadResult.error.message || "BP 上传失败。" }, { status: 500 });

  const { data: asset, error: assetError } = await supabase.from("bp_assets").insert({
    project_id: projectId,
    storage_path: storagePath,
    original_name: file.name,
    mime_type: mimeType,
    size_bytes: file.size,
    version,
    uploaded_by: currentUser.profile.id,
  }).select("id, original_name, mime_type, size_bytes, version, created_at").single();

  if (assetError) {
    await supabase.storage.from("bp-private").remove([storagePath]);
    return NextResponse.json({ error: assetError.message || "BP 记录保存失败。" }, { status: 500 });
  }

  return NextResponse.json({ asset }, { status: 201 });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return unavailable();
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: assets, error } = await supabase.from("bp_assets").select("id, storage_path, original_name, mime_type, size_bytes, version, created_at").eq("project_id", projectId).eq("status", "active").order("version", { ascending: false });
  if (error) return NextResponse.json({ error: "BP 查询失败。" }, { status: 500 });

  const signedAssets = await Promise.all((assets ?? []).map(async (asset) => {
    const signed = await supabase.storage.from("bp-private").createSignedUrl(asset.storage_path, 300);
    return { ...asset, storage_path: undefined, url: signed.data?.signedUrl ?? null };
  }));
  return NextResponse.json({ assets: signedAssets });
}
