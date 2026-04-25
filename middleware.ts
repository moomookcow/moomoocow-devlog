import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminAllowed } from "@/lib/admin";

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const hasAuthCode = requestUrl.searchParams.has("code");
  const hasOtpToken =
    requestUrl.searchParams.has("token_hash") && requestUrl.searchParams.has("type");

  if ((hasAuthCode || hasOtpToken) && requestUrl.pathname !== "/auth/confirm") {
    const confirmUrl = new URL("/auth/confirm", request.url);
    requestUrl.searchParams.forEach((value, key) => {
      confirmUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(confirmUrl);
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginRoute = request.nextUrl.pathname.startsWith("/admin/login");

  if (!isAdminRoute) {
    return response;
  }

  const next = request.nextUrl.pathname + request.nextUrl.search;

  if (!user) {
    if (isAdminLoginRoute) return response;

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAdminAllowed(user)) {
    const deniedUrl = new URL("/admin/login", request.url);
    deniedUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(deniedUrl);
  }

  if (isAdminLoginRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image
     * - favicon.ico and common static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
