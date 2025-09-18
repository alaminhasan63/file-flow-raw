import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}
export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="card-header">{children}</div>;
}
export function CardBody({ children }: { children: ReactNode }) {
  return <div className="card-body">{children}</div>;
}
export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="card-body border-t border-[var(--border)]">{children}</div>;
}

/* ---- shadcn-style aliases expected in some files ---- */
export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}
export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="muted text-sm">{children}</p>;
}
export function CardContent({ children }: { children: ReactNode }) {
  return <div className="card-body">{children}</div>;
}