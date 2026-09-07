"use server";

import { getCurrentSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { StaffStatus } from "@/types/auth";

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    throw new Error("Only admins can manage staff accounts.");
  }
  return session;
}

export async function updateStaffStatus(id: string, status: StaffStatus) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("role", "staff");
  if (error) throw new Error(error.message);
}

/**
 * Deletes the underlying auth.users row (service-role, bypasses RLS) so the
 * account can no longer sign in at all - deleting only the profiles row
 * would leave a live, still-authenticatable Supabase Auth user behind.
 */
export async function deleteStaffAccount(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
}
