import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/nav/user-menu";
import { NotificationBell } from "@/components/nav/notification-bell";

export async function Topbar({ email }: { email?: string | null }) {
  return (
    <header className="h-14 border-b flex items-center">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="font-semibold">FileFlow</a>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {email && <NotificationBell />}
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
}