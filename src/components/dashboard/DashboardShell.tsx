"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Warehouse,
  Tag,
  History,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  Users,
} from "lucide-react";
import { BRAND } from "@/data/catalog";
import { getSession, logout } from "@/lib/auth";
import { cn } from "@/lib/format";
import type { Session, UserRole } from "@/types/auth";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STAFF_NAV: NavItem[] = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/orders", label: "Orders", icon: ClipboardList },
  { href: "/staff/products", label: "Products", icon: Package },
  { href: "/staff/inventory", label: "Inventory Management", icon: Warehouse },
  { href: "/staff/sales", label: "Sales", icon: Tag },
  { href: "/staff/order-history", label: "Order History", icon: History },
  { href: "/staff/reports", label: "Reports", icon: BarChart3 },
  { href: "/staff/settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/staff-management", label: "Staff Management", icon: Users },
  { href: "/admin/order-history", label: "Order History", icon: History },
  { href: "/admin/inventory", label: "Inventory Management", icon: Warehouse },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/staff" || href === "/admin") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

type DashboardShellProps = {
  role: UserRole;
  children: React.ReactNode;
};

export function DashboardShell({ role, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    const current = getSession();
    if (!current || current.role !== role) {
      router.replace("/login");
      return;
    }
    setSessionState(current);
  }, [role, router]);

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center hero-gradient">
        <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
      </div>
    );
  }

  const nav = role === "admin" ? ADMIN_NAV : STAFF_NAV;
  const subtitle = role === "admin" ? "Admin Dashboard" : "Staff Dashboard";

  return (
    <div className="flex min-h-dvh hero-gradient">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-[var(--sidebar)] text-white lg:w-60">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <Image
                src={BRAND.logo}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <p className="font-display text-sm font-bold">{BRAND.name}</p>
              <p className="text-[11px] text-white/60">{subtitle}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[var(--sidebar-active)] text-white shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View customer site
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col pl-56 lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-[var(--cream)]/90 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-[var(--ink)]">
              Picolé Operations
            </p>
            <span className="rounded-full bg-[var(--sidebar-soft)] px-3 py-1 text-xs font-medium text-[var(--sidebar)]">
              {session.email}
            </span>
          </div>
        </header>

        <main className="hero-gradient flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
