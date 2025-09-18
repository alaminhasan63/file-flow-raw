import { Topbar } from "@/components/nav/topbar";
import { SideNav } from "@/components/nav/side-nav";

export async function AppShell({
  email,
  nav,
  children,
}: {
  email?: string | null;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Topbar email={email} />
      <div className="flex">
        <SideNav items={nav} />
        <main className="flex-1">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}