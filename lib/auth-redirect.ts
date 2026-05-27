const DEFAULT_ADMIN_NEXT_PATH = "/admin";

export function normalizeNextPath(
  value: string | null | undefined,
  fallback = DEFAULT_ADMIN_NEXT_PATH,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  return value;
}

export function buildAdminLoginUrl(error?: string, nextPath?: string): string {
  const search = new URLSearchParams();
  const safeNext = normalizeNextPath(nextPath);

  if (error) search.set("error", error);
  if (safeNext) search.set("next", safeNext);

  const query = search.toString();
  return query ? `/admin/login?${query}` : "/admin/login";
}
