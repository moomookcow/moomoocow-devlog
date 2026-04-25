import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/confirm"],
};
