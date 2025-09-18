"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function DebugAuthPage() {
  const supabase = getBrowserSupabase();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const sess = await supabase.auth.getSession();
      const usr = await supabase.auth.getUser();
      setData({ session: sess.data.session, user: usr.data.user });
    })();
  }, [supabase]);

  return (
    <pre className="p-4 text-xs overflow-auto rounded border">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}