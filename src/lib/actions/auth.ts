"use server";

import { createClient } from "@/lib/supabase/server";
import type { Session } from "@/types/auth";

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });
  if (error || !data.user) {
    return { ok: false, error: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: "Invalid email or password." };
  }

  if (profile.role === "staff" && profile.status === "pending") {
    await supabase.auth.signOut();
    return { ok: false, error: "Your account is pending admin approval." };
  }
  if (profile.role === "staff" && profile.status === "rejected") {
    await supabase.auth.signOut();
    return { ok: false, error: "Your account was not approved." };
  }

  return {
    ok: true,
    session: {
      userId: data.user.id,
      email: normalized,
      role: profile.role,
      name: profile.name,
    },
  };
}

export async function registerStaff(
  email: string,
  password: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password || !name.trim()) {
    return { ok: false, error: "All fields are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: { data: { name: name.trim() } },
  });

  if (error) {
    return { ok: false, error: "An account with this email already exists." };
  }
  // Supabase silently no-ops signUp for an already-registered email (to
  // avoid leaking which emails exist) and returns a user with no identities.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: "An account with this email already exists." };
  }

  // Registration never signs the user in - they wait for admin approval.
  await supabase.auth.signOut();
  return { ok: true };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
