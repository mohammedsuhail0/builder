import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, errorJson, okJson, preflight, validateBody } from "@/lib/api-security";

const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  originPostId: z.string().uuid().optional(),
});

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`project:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const { data, error } = await supabase
    .from("projects")
    .select("id,name,description,created_at,created_by")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return errorJson("PROJECTS_FETCH_FAILED", 400, "Failed to fetch projects.", request);
  return okJson({ data }, request);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);

  const rlRes = await enforceRateLimit(`project-create:${user.id}`, "upload", request);
  if (rlRes) return rlRes;

  const raw = await request.json();
  const parsed = validateBody(projectSchema, raw);
  if (!parsed.ok) return parsed.response;

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
    return errorJson("PROJECT_CREATE_FAILED", 400, "Failed to create project.", request);
  }

  await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "founder",
  });

  return okJson({ ok: true, projectId: project.id }, request, { status: 201 });
}
