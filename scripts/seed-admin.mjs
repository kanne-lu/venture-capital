import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = (process.env.ADMIN_EMAIL || "admin@qifeng.capital").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !adminPassword) {
  throw new Error("需要 NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY 和 ADMIN_PASSWORD。");
}

if (adminPassword.length < 6) {
  throw new Error("ADMIN_PASSWORD 至少需要 6 个字符。");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  throw new Error("管理员账号数量超过初始化脚本的分页上限。");
}

const existingUser = await findUserByEmail(adminEmail);
let user;

if (existingUser) {
  const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      ...existingUser.user_metadata,
      subject_name: "平台管理员",
      contact_name: "平台管理员",
    },
  });
  if (error) throw error;
  user = data.user;
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      subject_name: "平台管理员",
      contact_name: "平台管理员",
    },
  });
  if (error) throw error;
  user = data.user;
}

if (!user) throw new Error("Supabase 没有返回管理员用户。");

const now = new Date().toISOString();
const { error: profileError } = await supabase.from("profiles").upsert({
  id: user.id,
  role: "admin",
  admin_role: "super_admin",
  account_status: "approved",
  subject_name: "平台管理员",
  contact_name: "平台管理员",
  email_verified_at: now,
  approved_at: now,
  public_visible: false,
}, { onConflict: "id" });

if (profileError) throw profileError;

console.log(`管理员账号已就绪：${adminEmail}`);
