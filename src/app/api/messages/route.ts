import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encryptText } from "@/lib/crypto";
import { enforceRateLimit, errorJson, okJson, preflight, validateBody } from "@/lib/api-security";

const messageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorJson("UNAUTHORIZED", 401, "Unauthorized", request);
  const rlRes = await enforceRateLimit(`dm:${user.id}`, "dm", request);
  if (rlRes) return rlRes;

  const raw = await request.json();
  const parsed = validateBody(messageSchema, raw);
  if (!parsed.ok) return parsed.response;

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    recipient_id: parsed.data.recipientId,
    content: encryptText(parsed.data.content),
  });
  if (error) return errorJson("MESSAGE_CREATE_FAILED", 400, "Failed to send message.", request);

  await supabase.from("notifications").insert({
    user_id: parsed.data.recipientId,
    actor_id: user.id,
    type: "dm",
    title: "New message",
    payload: { from: user.id },
  });

  return okJson({ ok: true }, request);
}
