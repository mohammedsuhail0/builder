import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, errorJson, okJson, preflight, validateBody } from "@/lib/api-security";

const followSchema = z.object({ targetUserId: z.string().uuid(), following: z.boolean() });

export async function OPTIONS(request: Request) { return preflight(request); }

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);

  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  if (!ids.length) return okJson({ following: {} }, request);

  const { data, error } = await supabase.from("user_follows").select("following_id").eq("follower_id", user.id).in("following_id", ids);
  if (error) return errorJson("FOLLOWS_FETCH_FAILED", 400, "Failed to fetch follows.", request);

  const following: Record<string, boolean> = {};
  for (const id of ids) following[id] = false;
  for (const row of data ?? []) following[row.following_id] = true;
  return okJson({ following }, request);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`follow:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const parsed = validateBody(followSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  if (parsed.data.following) {
    const { error } = await supabase.from("user_follows").upsert({ follower_id: user.id, following_id: parsed.data.targetUserId });
    if (error) return errorJson("FOLLOW_SET_FAILED", 400, "Failed to follow.", request);
  } else {
    const { error } = await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", parsed.data.targetUserId);
    if (error) return errorJson("FOLLOW_UNSET_FAILED", 400, "Failed to unfollow.", request);
  }

  return okJson({ ok: true }, request);
}
