import { AppShell } from "@/components/layout/app-shell";
import { UserDataFetcher } from "@/components/auth/user-data-fetcher";

export const dynamic = "force-dynamic";

async function GetUserEmail() {
  return await UserDataFetcher();
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const email = await GetUserEmail();
  
  return (
    <AppShell email={email}>
      {children}
    </AppShell>
  );
}