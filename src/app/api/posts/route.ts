import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const createPostSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
  skillsNeeded: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  imageUrls: z.array(z.string().trim().min(1)).max(4).default([]),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = await checkRateLimit(`post:${user.id}`, 12, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(`post-create:${user.id}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const raw = await request.json();
  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name,college")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Complete onboarding profile first." },
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
    return NextResponse.json({ error: postError?.message }, { status: 400 });
  }

  const { error: tsError } = await supabase.from("idea_timestamps").insert({
    post_id: post.id,
    author_id: user.id,
    author_name: profile.name,
    author_college: profile.college,
  });

  if (tsError) {
    return NextResponse.json({ error: tsError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, postId: post.id }, { status: 201 });
}
