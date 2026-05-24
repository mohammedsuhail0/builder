import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { isMvpMode } from "@/lib/mvp-mode";

export async function updateSession(request: NextRequest) {
  if (isMvpMode()) {
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
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

  const pathname = request.nextUrl.pathname;
  const isAuthPath =
    pathname.startsWith("/auth") || pathname.startsWith("/onboarding");
  const isProtectedPath =
    pathname.startsWith("/feed") ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/posts/new");

  let requiresReset = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("requires_password_reset")
      .eq("id", user.id)
      .single();
    if (profile?.requires_password_reset) {
      requiresReset = true;
    }
  }

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user needs a reset, force them to the reset page
  if (user && requiresReset && pathname !== "/auth/reset-password") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/reset-password";
    return NextResponse.redirect(url);
  }

  // If user does not need a reset, prevent access to auth pages
  if (user && !requiresReset && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  return response;
}
