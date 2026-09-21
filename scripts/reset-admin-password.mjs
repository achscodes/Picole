// One-off utility: force-sets a Supabase Auth user's password by email,
// bypassing the normal "forgot password" email flow. Useful when you know
// the account but not its current password (e.g. re-provisioning a demo
// admin) and don't want to go through the Supabase dashboard.
//
// Usage:
//   node --env-file=.env.local scripts/reset-admin-password.mjs <email> <newPassword>
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from
// .env.local) - the service role key bypasses RLS, so this must only ever
// be run locally/trusted, never exposed to a browser.

import { createClient } from "@supabase/supabase-js";

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error(
    "Usage: node --env-file=.env.local scripts/reset-admin-password.mjs <email> <newPassword>",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - pass --env-file=.env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, email")
  .eq("email", email)
  .single();

if (profileError || !profile) {
  console.error(`No profile found for ${email}:`, profileError?.message ?? "not found");
  process.exit(1);
}

const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
  password: newPassword,
});

if (updateError) {
  console.error("Failed to update password:", updateError.message);
  process.exit(1);
}

console.log(`Password updated for ${email} (id: ${profile.id})`);
