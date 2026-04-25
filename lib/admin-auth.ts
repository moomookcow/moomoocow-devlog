import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { isAdminAllowed } from "@/lib/admin";
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

  if (!user) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!isAdminAllowed(user)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }

  return user;
}

