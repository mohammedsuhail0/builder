"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
      onClick={onLogout}
      type="button"
    >
      Logout
    </button>
  );
}

