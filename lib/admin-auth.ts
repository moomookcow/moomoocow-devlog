import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { isAdminAllowed } from "@/lib/admin";
import { buildAdminLoginUrl } from "@/lib/auth-redirect";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function requireAdminOrRedirect(
  supabase: SupabaseServerClient,
  nextPath: string,
): Promise<User> {
  const {
    data: { user: directUser },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = directUser ?? session?.user ?? null;

  if (process.env.NODE_ENV !== "production") {
    console.log("[admin-auth]", {
      nextPath,
      directUser: directUser?.email ?? null,
      sessionUser: session?.user?.email ?? null,
      hasSession: Boolean(session),
    });
  }

  if (!user) {
    redirect(buildAdminLoginUrl(undefined, nextPath));
  }

  if (!isAdminAllowed(user)) {
    try {
      await supabase.auth.signOut();
    } catch {
      // noop
    }
    redirect(buildAdminLoginUrl("forbidden", nextPath));
  }

  return user;
}
