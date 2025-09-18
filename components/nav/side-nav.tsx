"use client";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type Item = { href: string; label: string; icon?: React.ReactNode };

export function SideNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav className="w-60 border-r min-h-[calc(100vh-3.5rem)]">
      <ul className="p-3 space-y-1">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <a
                href={it.href}
                className={clsx(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {it.icon}
                <span>{it.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}