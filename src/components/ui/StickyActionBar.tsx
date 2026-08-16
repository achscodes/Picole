"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type StickyActionBarProps = {
  left: ReactNode;
  right: ReactNode;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  wrapperClassName?: string;
  className?: string;
};

export function StickyActionBar({
  left,
  right,
  icon: Icon,
  href,
  onClick,
  disabled,
  type = "button",
  wrapperClassName,
  className,
}: StickyActionBarProps) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="h-4 w-4" />}
        {left}
      </span>
      <span className="text-sm font-bold">{right}</span>
    </>
  );

  const pillClassName = cn(
    "mx-auto flex max-w-lg items-center justify-between rounded-full bg-[var(--brand-green)] px-5 py-3.5 text-white shadow-float transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    className,
  );

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2",
        wrapperClassName,
      )}
    >
      {href ? (
        <Link href={href} className={pillClassName}>
          {content}
        </Link>
      ) : (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={pillClassName}
        >
          {content}
        </button>
      )}
    </div>
  );
}
