import type { User } from "@supabase/supabase-js";

function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set<string>();

  return new Set(
    raw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminAllowed(user: User | null | undefined): boolean {
  if (!user?.email) return false;

  const emailAllowlist = parseAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  if (emailAllowlist.size === 0) return false;

  return emailAllowlist.has(user.email.toLowerCase());
}

export function getAdminLabel(user: User | null | undefined): string {
  return user?.email ?? "unknown";
}

