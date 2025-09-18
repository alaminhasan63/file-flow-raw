"use client";
import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function NotificationBell() {
  const supabase = getBrowserSupabase();
  const [count, setCount] = useState<number>(0);

  const load = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("notifications")
      .select("id")
      .is("read_at", null)
      .eq("user_id", uid);
    setCount((data ?? []).length);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  return (
    <a href="/app/inbox" className="relative rounded-lg border px-3 py-1 text-sm">
      Inbox
      {count > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] min-w-5 h-5 px-1">
          {count}
        </span>
      )}
    </a>
  );
}