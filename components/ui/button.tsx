"use client";
import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost";
  loading?: boolean;
};
export function Button({ className, variant="default", loading, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={clsx(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "btn-ghost",
        className
      )}
    >
      {loading ? "…" : children}
    </button>
  );
}