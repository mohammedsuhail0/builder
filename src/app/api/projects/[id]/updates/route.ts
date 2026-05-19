import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  isMilestone: z.boolean().default(false),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json();
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase.from("project_updates").insert({
    project_id: id,
    author_id: user.id,
    content: parsed.data.content,
    is_milestone: parsed.data.isMilestone,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: followers } = await supabase
    .from("project_follows")
    .select("user_id")
    .eq("project_id", id);
  if ((followers ?? []).length > 0) {
    await supabase.from("notifications").insert(
      followers!.map((f) => ({
        user_id: f.user_id,
        actor_id: user.id,
        type: "project_update",
        title: "Project updated",
        payload: { projectId: id },
      })),
    );
  }

  return NextResponse.json({ ok: true });
}

