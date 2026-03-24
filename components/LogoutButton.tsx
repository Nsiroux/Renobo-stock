"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    if (!supabase) {
      router.replace("/login");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="rounded-2xl border border-[var(--brand)]/20 bg-white px-4 py-2 text-sm font-medium text-[var(--brand)]"
    >
      Logout
    </button>
  );
}
