import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, errorJson, okJson, preflight } from "@/lib/api-security";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`notifications:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,type,is_read,created_at,payload")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return errorJson("NOTIFICATIONS_FETCH_FAILED", 400, "Failed to fetch notifications.", request);
  return okJson({ data }, request);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`notifications-mark:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  if (error) return errorJson("NOTIFICATIONS_MARK_FAILED", 400, "Failed to mark notifications.", request);
  return okJson({ ok: true }, request);
}
