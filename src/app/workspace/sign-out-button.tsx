"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return <button className="workspace-sign-out" type="button" onClick={() => void signOut()}>退出登录</button>;
}
