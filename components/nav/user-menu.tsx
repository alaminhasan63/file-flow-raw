"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function UserMenu({ email }: { email?: string | null }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(email || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user?.email || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user?.email || null);

        // If user signed out, redirect to signin
        if (event === 'SIGNED_OUT') {
          router.replace("/sign-in");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  async function signOut() {
    setIsLoading(true);
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    // The redirect will be handled by the auth state change listener
    setIsLoading(false);
  }

  // If no user is detected, don't render the menu
  if (!currentUser && !email) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {currentUser || email || ""}
      </span>
      <button
        onClick={signOut}
        disabled={isLoading}
        className="rounded-lg border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        {isLoading ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}