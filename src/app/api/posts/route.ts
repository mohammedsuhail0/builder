import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, errorJson, okJson, preflight, validateBody } from "@/lib/api-security";

const createPostSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
  skillsNeeded: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  imageUrls: z
    .array(z.string().trim().regex(/^posts\/[A-Za-z0-9._/-]+$/))
    .max(4)
    .default([]),
});

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  }
  const rlRes = await enforceRateLimit(`post:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = 20;
  const from = Math.max(0, (page - 1) * limit);
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id,title,description,skills_needed,created_at,author_id,idea_timestamps(posted_at,author_name,author_college)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return errorJson("POSTS_FETCH_FAILED", 400, "Failed to fetch posts.", request);
  }

  return okJson({ data }, request);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  }

  const rlRes = await enforceRateLimit(`post-create:${user.id}`, "upload", request);
  if (rlRes) return rlRes;

  const raw = await request.json();
  const parsed = validateBody(createPostSchema, raw);
  if (!parsed.ok) return parsed.response;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name,college")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Complete onboarding profile first.", code: "PROFILE_INCOMPLETE" },
      { status: 400 },
    );
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      skills_needed: parsed.data.skillsNeeded,
      image_urls: parsed.data.imageUrls,
    })
    .select("id")
    .single();

  if (postError || !post) {
    return errorJson("POST_CREATE_FAILED", 400, "Failed to create post.", request);
  }

  const { error: tsError } = await supabase.from("idea_timestamps").insert({
    post_id: post.id,
    author_id: user.id,
    author_name: profile.name,
    author_college: profile.college,
  });

  if (tsError) {
    return errorJson("TIMESTAMP_CREATE_FAILED", 400, "Failed to create timestamp.", request);
  }

  return okJson({ ok: true, postId: post.id }, request, { status: 201 });
}
