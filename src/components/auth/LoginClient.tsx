"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BRAND } from "@/data/catalog";
import { login, registerStaff } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";

type Tab = "login" | "register";

function roleHomePath(role: "admin" | "staff") {
  if (role === "admin") return "/admin";
  return "/staff";
}

export function LoginClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [, startTransition] = useTransition();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(roleHomePath(result.session.role));
    });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await registerStaff(email, password, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        "Account created! An admin must approve your account before you can sign in.",
      );
      setTab("login");
      setPassword("");
    });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--cream)] px-4 py-10">
      <div className="w-full max-w-md rounded-card bg-white p-8 shadow-card">
        <div className="text-center">
          <Image
            src={BRAND.logo}
            alt={BRAND.name}
            width={140}
            height={48}
            className="mx-auto h-12 w-auto object-contain"
            priority
          />
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
            Healthy Ice Pops
          </p>
          <h1 className="mt-5 text-xl font-bold text-[var(--ink)]">
            Staff and Admin
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Sign in to manage sales, products, and reports
          </p>
        </div>

        <div className="mt-6 flex rounded-full bg-[var(--cream-strong)] p-1">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError("");
                setSuccess("");
              }}
              className={cn(
                "flex-1 rounded-full py-2 text-sm font-semibold transition",
                tab === t
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--ink-muted)]",
              )}
            >
              {t === "login" ? "Login" : "Create Account"}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 rounded-2xl bg-[var(--brand-green-soft)] px-4 py-3 text-sm text-[var(--brand-green-dark)]">
            {success}
          </p>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-[var(--ink-muted)]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--ink-muted)]">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
                required
              />
            </label>
            <Button type="submit" fullWidth className="mt-2">
              Sign In
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-[var(--ink-muted)]">
                Full Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--ink-muted)]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--ink-muted)]">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
                required
                minLength={6}
              />
            </label>
            <Button type="submit" fullWidth className="mt-2">
              Create Account
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
