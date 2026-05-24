import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, errorJson, okJson, preflight, validateBody } from "@/lib/api-security";

const reactionSchema = z.object({ postId: z.string().uuid(), liked: z.boolean() });

export async function OPTIONS(request: Request) { return preflight(request); }

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);

  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  if (!ids.length) return okJson({ counts: {}, liked: {} }, request);

  const { data: rows, error } = await supabase
    .from("post_reactions")
    .select("post_id,user_id")
    .in("post_id", ids)
    .eq("reaction", "like");
  if (error) return errorJson("REACTIONS_FETCH_FAILED", 400, "Failed to fetch reactions.", request);

  const counts: Record<string, number> = {};
  const liked: Record<string, boolean> = {};
  for (const id of ids) { counts[id] = 0; liked[id] = false; }
  for (const row of rows ?? []) {
    counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
    if (row.user_id === user.id) liked[row.post_id] = true;
  }

  return okJson({ counts, liked }, request);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`reaction:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const parsed = validateBody(reactionSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  if (parsed.data.liked) {
    const { error } = await supabase.from("post_reactions").upsert({ post_id: parsed.data.postId, user_id: user.id, reaction: "like" });
    if (error) return errorJson("REACTION_SET_FAILED", 400, "Failed to like post.", request);
  } else {
    const { error } = await supabase.from("post_reactions").delete().eq("post_id", parsed.data.postId).eq("user_id", user.id).eq("reaction", "like");
    if (error) return errorJson("REACTION_UNSET_FAILED", 400, "Failed to unlike post.", request);
  }

  return okJson({ ok: true }, request);
}
