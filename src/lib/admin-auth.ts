import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { isAdminEmailAllowed } from "@/lib/admin";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function requireAdminOrRedirect(
  supabase: SupabaseServerClient,
  nextPath: string,
): Promise<User> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  if (!user) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!isAdminEmailAllowed(user.email)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }

  return user;
}

