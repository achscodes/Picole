import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Session, StaffAccount, StaffStatus } from "@/types/auth";

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  status: StaffStatus;
  created_at: string;
};

function mapStaffRow(row: ProfileRow): StaffAccount {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: "staff",
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Resolves the caller's session from a live Supabase Auth check (never a
 * trusted-but-unverified cookie). Returns null for a signed-out user, or for
 * a staff account that isn't approved yet - mirrors how `login()` already
 * refuses to sign in a pending/rejected account.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, name, role, status")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  if (profile.role === "staff" && profile.status !== "approved") return null;

  return {
    userId: user.id,
    email: profile.email,
    role: profile.role,
    name: profile.name,
  };
}

/** Admin-only: lists staff registrations, optionally filtered by status. */
export async function listStaffAccounts(
  status?: StaffStatus,
): Promise<StaffAccount[]> {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    throw new Error("Only admins can view staff accounts.");
  }

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, email, name, status, created_at")
    .eq("role", "staff")
    .order("created_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapStaffRow);
}
