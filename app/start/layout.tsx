import { ReactNode } from "react";

export default function PublicStartLayout({ children }: { children: ReactNode }) {
    // No authentication required for this layout
    return <>{children}</>;
}
