"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Tag,
  History,
  BarChart3,
  Settings,
  LogOut,
  Users,
  ShoppingCart,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { BRAND } from "@/data/catalog";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/format";
import { clearReadCaches } from "@/lib/offline/db";
import { useOfflineSaleQueue } from "@/hooks/useOfflineSaleQueue";
import { ConnectivityBadge } from "@/components/pwa/ConnectivityBadge";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { PendingSyncIndicator } from "@/components/pwa/PendingSyncIndicator";
import type { Session } from "@/types/auth";
import { useState, useTransition } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STAFF_NAV: NavItem[] = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/pos", label: "POS", icon: ShoppingCart },
  { href: "/staff/transactions", label: "Transactions", icon: History },
  { href: "/staff/products", label: "Products", icon: Package },
  { href: "/staff/inventory", label: "Inventory", icon: Warehouse },
  { href: "/staff/sales", label: "Sales", icon: Tag },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pos", label: "POS", icon: ShoppingCart },
  { href: "/admin/transactions", label: "Transactions", icon: History },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/sales", label: "Sales", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/staff-management", label: "Staff Management", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/staff" || href === "/admin") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

type DashboardShellProps = {
  session: Session;
  children: React.ReactNode;
};

export function DashboardShell({ session, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [desktopNavExpanded, setDesktopNavExpanded] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [, startTransition] = useTransition();
  const { pendingSales, retry, cancel } = useOfflineSaleQueue(session);

  const role = session.role;
  const nav = role === "admin" ? ADMIN_NAV : STAFF_NAV;
  const subtitle = role === "admin" ? "Admin Dashboard" : "Staff";

  const unsyncedCount = pendingSales.filter(
    (sale) => sale.status !== "synced" && sale.status !== "synced-with-discrepancy",
  ).length;
  const signOutMessage =
    unsyncedCount > 0
      ? `${unsyncedCount} sale${unsyncedCount === 1 ? "" : "s"} you rang up ${unsyncedCount === 1 ? "hasn't" : "haven't"} synced yet. Signing out won't lose ${unsyncedCount === 1 ? "it" : "them"}, but you (or an admin) will need to sign back in to finish syncing.`
      : "You will need to enter your credentials to access the portal again.";

  return (
    <div className="flex min-h-dvh hero-gradient">
      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "group fixed inset-y-0 left-0 z-40 flex w-56 -translate-x-full flex-col overflow-hidden bg-[var(--sidebar)] text-white transition-[transform,width] duration-200 lg:w-20 lg:translate-x-0 lg:hover:w-60",
          navOpen && "translate-x-0",
          desktopNavExpanded && "lg:w-60",
        )}
      >
        <div className="border-b border-white/10 px-5 py-5 lg:px-4">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
              <Image
                src={BRAND.logo}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className={cn(
              "transition-opacity duration-200",
              !desktopNavExpanded && "lg:opacity-0 lg:group-hover:opacity-100",
            )}>
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
                <span className={cn(
                  "whitespace-nowrap transition-opacity duration-200",
                  !desktopNavExpanded && "lg:opacity-0 lg:group-hover:opacity-100",
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className={cn(
              "whitespace-nowrap transition-opacity duration-200",
              !desktopNavExpanded && "lg:opacity-0 lg:group-hover:opacity-100",
            )}>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col lg:pl-20">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-[var(--cream)]/90 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconButton
                icon={Menu}
                label="Open navigation"
                onClick={() => setNavOpen(true)}
                className="lg:hidden"
              />
              <IconButton
                icon={desktopNavExpanded ? PanelLeftClose : PanelLeftOpen}
                label={desktopNavExpanded ? "Minimize navigation" : "Keep navigation expanded"}
                onClick={() => setDesktopNavExpanded((expanded) => !expanded)}
                className="hidden lg:block"
              />
              <p className="font-display text-sm font-semibold text-[var(--ink)]">
                Picolé Operations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ConnectivityBadge />
              <PendingSyncIndicator pendingSales={pendingSales} onRetry={retry} onCancel={cancel} />
              <span className="rounded-full bg-[var(--sidebar-soft)] px-3 py-1 text-xs font-medium text-[var(--sidebar)]">
                {session.email}
              </span>
            </div>
          </div>
        </header>

        <OfflineBanner />

        <main className="hero-gradient flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        message={signOutMessage}
        confirmLabel="Sign out"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          startTransition(async () => {
            // logout() is a Server Action and can't touch client storage
            // itself - clear read caches here so the next person on a
            // shared terminal never sees this cashier's cached data.
            // pendingSales is never cleared this way (see clearReadCaches).
            await clearReadCaches();
            await logout();
            router.replace("/login");
          });
        }}
      />
    </div>
  );
}
