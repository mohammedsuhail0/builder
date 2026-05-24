import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, errorJson, okJson, preflight } from "@/lib/api-security";

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
  const rlRes = await enforceRateLimit(`project-follow:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const { error } = await supabase.from("project_follows").upsert({
    project_id: id,
    user_id: user.id,
  });
  if (error) return errorJson("FOLLOW_FAILED", 400, "Failed to follow project.", request);
  return okJson({ ok: true }, request);
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`project-unfollow:${user.id}`, "general", request);
  if (rlRes) return rlRes;

  const { error } = await supabase
    .from("project_follows")
    .delete()
    .eq("project_id", id)
    .eq("user_id", user.id);
  if (error) return errorJson("UNFOLLOW_FAILED", 400, "Failed to unfollow project.", request);
  return okJson({ ok: true }, request);
}
