function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set<string>();

  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowlist = parseAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  if (allowlist.size === 0) return false;

  return allowlist.has(email.toLowerCase());
}
