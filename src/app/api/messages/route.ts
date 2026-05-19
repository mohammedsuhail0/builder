import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { encryptText } from "@/lib/crypto";

const messageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = checkRateLimit(`dm:${user.id}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const raw = await request.json();
  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    recipient_id: parsed.data.recipientId,
    content: encryptText(parsed.data.content),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("notifications").insert({
    user_id: parsed.data.recipientId,
    actor_id: user.id,
    type: "dm",
    title: "New message",
    payload: { from: user.id },
  });

  return NextResponse.json({ ok: true });
}
