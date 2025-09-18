import { AppShell } from "@/components/layout/app-shell";
import { UserDataFetcher } from "@/components/auth/user-data-fetcher";
import { RequireAuth } from "@/components/auth/require-auth";

export const dynamic = "force-dynamic";

async function GetUserEmail() {
  return await UserDataFetcher();
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const email = await GetUserEmail();

  return (
    <AppShell email={email}>
      <RequireAuth>{children}</RequireAuth>
    </AppShell>
  );
}