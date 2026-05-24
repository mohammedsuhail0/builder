import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, errorJson, okJson, preflight, validateBody } from "@/lib/api-security";

const updateSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  isMilestone: z.boolean().default(false),
});

type Params = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`project-update:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const raw = await request.json();
  const parsed = validateBody(updateSchema, raw);
  if (!parsed.ok) return parsed.response;

  const { error } = await supabase.from("project_updates").insert({
    project_id: id,
    author_id: user.id,
    content: parsed.data.content,
    is_milestone: parsed.data.isMilestone,
  });
  if (error) return errorJson("PROJECT_UPDATE_FAILED", 400, "Failed to post update.", request);

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

  return okJson({ ok: true }, request);
}
