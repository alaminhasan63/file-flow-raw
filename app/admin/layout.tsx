import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAdmin } from "@/components/auth/require-admin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell admin>
      <RequireAdmin>{children}</RequireAdmin>
    </AppShell>
  );
}