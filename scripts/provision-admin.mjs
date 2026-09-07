// One-off utility: creates a Supabase Auth user and promotes their profile
// to role='admin', status='approved'. Everyone else who signs up via /login
// starts as pending staff - this script is the only way an admin gets made.
//
// Usage:
//   node --env-file=.env.local scripts/provision-admin.mjs <email> <password> <name>
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from
// .env.local) - the service role key bypasses RLS, so this must only ever
// be run locally/trusted, never exposed to a browser.

import { createClient } from "@supabase/supabase-js";

const [, , email, password, ...nameParts] = process.argv;
const name = nameParts.join(" ");

if (!email || !password || !name) {
  console.error(
    "Usage: node --env-file=.env.local scripts/provision-admin.mjs <email> <password> <name>",
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

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name },
});

if (createError) {
  console.error("Failed to create auth user:", createError.message);
  process.exit(1);
}

const userId = created.user.id;

// The on_auth_user_created trigger already inserted a profiles row
// (role='staff', status='pending') synchronously - promote it now.
const { error: updateError } = await supabase
  .from("profiles")
  .update({ role: "admin", status: "approved" })
  .eq("id", userId);

if (updateError) {
  console.error("User was created but could not be promoted to admin:", updateError.message);
  process.exit(1);
}

console.log(`Admin account ready: ${email} (id: ${userId})`);
