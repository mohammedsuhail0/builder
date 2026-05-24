import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/auth/:path*",
    "/onboarding/:path*",
    "/feed/:path*",
    "/explore/:path*",
    "/profile/:path*",
    "/messages/:path*",
    "/projects/:path*",
    "/notifications/:path*",
    "/posts/:path*",
    "/reels/:path*",
  ],
};

