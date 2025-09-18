"use client";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { UserMenu } from "@/components/nav/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function AppHeader({ email }: { email?: string | null }) {
  const [currentUser, setCurrentUser] = useState<string | null>(email || null);

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
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b bg-card">
      <div className="container-wide flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary" />
          <span className="text-xl font-bold">FileFlow</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          {currentUser ? (
            <>
              <Link href="/app/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <UserMenu email={currentUser} />
              </div>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/app/start" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Start filing
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden md:block border-r bg-card w-64 shrink-0">
      <div className="p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        Admin
      </div>
      <nav className="px-3 py-2 space-y-1">
        <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" href="/admin/catalog">
          Catalog
        </a>
        <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" href="/admin/filings">
          Filings
        </a>
        <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" href="/admin/customers">
          Customers
        </a>
        <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" href="/admin/webhooks">
          Webhooks
        </a>
      </nav>
    </aside>
  );
}

export function AppShell({ children, admin = false, email }: { children: ReactNode; admin?: boolean; email?: string | null }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={email} />
      <div className="flex">
        {admin && <AdminSidebar />}
        <main className="flex-1">
          <div className="container-wide py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}