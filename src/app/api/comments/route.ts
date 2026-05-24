import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, errorJson, okJson, preflight, validateBody } from "@/lib/api-security";

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
});

export async function OPTIONS(request: Request) { return preflight(request); }

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const postId = new URL(request.url).searchParams.get("postId");
  if (!postId) return errorJson("BAD_REQUEST", 400, "postId is required.", request);

  const { data, error } = await supabase
    .from("comments")
    .select("id,post_id,author_id,text,created_at,profiles!comments_author_id_fkey(id,name,avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return errorJson("COMMENTS_FETCH_FAILED", 400, "Failed to fetch comments.", request);
  return okJson({ data: data ?? [] }, request);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`comment-create:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const parsed = validateBody(createCommentSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: parsed.data.postId, author_id: user.id, text: parsed.data.text })
    .select("id,post_id,author_id,text,created_at")
    .single();

  if (error || !data) return errorJson("COMMENT_CREATE_FAILED", 400, "Failed to add comment.", request);
  return okJson({ data }, request, { status: 201 });
}
