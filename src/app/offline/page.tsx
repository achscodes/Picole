import Image from "next/image";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { BRAND } from "@/data/catalog";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--cream)] px-5 py-10">
      <div className="w-full max-w-md rounded-card bg-white p-8 text-center shadow-card">
        <Image src={BRAND.logo} alt="Picolé" width={96} height={68} className="mx-auto h-16 w-auto object-contain" />
        <WifiOff className="mx-auto mt-6 h-10 w-10 text-[var(--brand-green)]" />
        <h1 className="mt-4 font-display text-2xl font-bold text-[var(--ink)]">You&apos;re offline</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          Reconnect to the internet before signing in or completing a transaction so inventory and sales stay accurate.
        </p>
        <Link href="/login" className="mt-6 inline-flex rounded-full bg-[var(--brand-green)] px-6 py-3 text-sm font-semibold text-white">
          Try again
        </Link>
      </div>
    </main>
  );
}
