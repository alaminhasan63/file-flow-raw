type Props = { kind?: "info" | "success" | "warn" | "error"; children: React.ReactNode };
export function Banner({ kind="info", children }: Props) {
  const styles: Record<string, string> = {
    info: "bg-blue-50 text-blue-900 border-blue-200",
    success: "bg-green-50 text-green-900 border-green-200",
    warn: "bg-yellow-50 text-yellow-900 border-yellow-200",
    error: "bg-red-50 text-red-900 border-red-200",
  };
  return <div className={`rounded-md border px-3 py-2 text-sm ${styles[kind]}`}>{children}</div>;
}