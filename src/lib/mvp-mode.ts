import { env } from "@/lib/env";

export function isMvpMode() {
  if (env.NEXT_PUBLIC_SUPABASE_URL?.includes("dummy")) {
    return true;
  }
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.NEXT_PUBLIC_MVP_MODE === "true";
}


