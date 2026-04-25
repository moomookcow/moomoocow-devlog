import type { User } from "@supabase/supabase-js";

function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set<string>();

  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getGitHubUsername(user: User): string | null {
  const candidates = [
    user.user_metadata?.user_name,
    user.user_metadata?.preferred_username,
    user.user_metadata?.username,
    user.user_metadata?.login,
  ];

  const hit = candidates.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  return hit ? hit.toLowerCase() : null;
}

export function isAdminAllowed(user: User | null | undefined): boolean {
  if (!user) return false;

  const emailAllowlist = parseAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  const githubAllowlist = parseAllowlist(process.env.ADMIN_GITHUB_ALLOWLIST);

  if (emailAllowlist.size === 0 && githubAllowlist.size === 0) {
    return false;
  }

  const email = user.email?.toLowerCase() ?? null;
  if (email && emailAllowlist.has(email)) {
    return true;
  }

  const githubUsername = getGitHubUsername(user);
  if (githubUsername && githubAllowlist.has(githubUsername)) {
    return true;
  }

  return false;
}
