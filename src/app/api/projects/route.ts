import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  originPostId: z.string().uuid().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await checkRateLimit(`project:${user.id}`, 6, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id,name,description,created_at,created_by")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(`project-create:${user.id}`, 3, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const raw = await request.json();
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
      origin_post_id: parsed.data.originPostId ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !project) {
    return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 400 });
  }

  await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "founder",
  });

  return NextResponse.json({ ok: true, projectId: project.id }, { status: 201 });
}
