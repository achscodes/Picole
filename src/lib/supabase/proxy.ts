import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { UserRole } from "@/types/auth";

/**
 * Revalidates the caller's Supabase session (never trust the cookie alone -
 * `getUser()` round-trips to Supabase Auth) and resolves their app role from
 * `profiles`. A pending/rejected staff profile resolves to `role: undefined`,
 * the same as being signed out, matching how `login()` already rejects them.
 *
 * Returns `response` with the refreshed auth cookies attached - callers must
 * return this object (not a fresh `NextResponse.next()`) or sessions will
 * silently expire.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; role: UserRole | undefined }> {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response, role: undefined };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role === "staff" && profile.status !== "approved")) {
    return { response, role: undefined };
  }

  return { response, role: profile.role as UserRole };
}
