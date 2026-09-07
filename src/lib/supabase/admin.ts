import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client - bypasses RLS entirely. Use only where that's
 * required, e.g. `auth.admin.deleteUser()` (deleteStaffAccount), which is
 * the only operation that actually revokes a Supabase Auth login rather than
 * just hiding a row.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
