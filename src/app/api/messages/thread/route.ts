import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptText } from "@/lib/crypto";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get("userId");

  // Case 1: Fetch chat thread with a specific partner
  if (partnerId) {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id,sender_id,recipient_id,content,created_at")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const decrypted = (messages || []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      recipientId: m.recipient_id,
      text: decryptText(m.content),
      timestamp: new Date(m.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return NextResponse.json(decrypted);
  }

  // Case 2: Fetch all DM channels / conversations
  const { data: msgs, error: msgsError } = await supabase
    .from("messages")
    .select("sender_id,recipient_id,content,created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (msgsError) {
    return NextResponse.json({ error: msgsError.message }, { status: 400 });
  }

  // Group by partner ID to find unique channels
  const conversationsMap = new Map<string, { lastMessage: string; time: string; timestampNum: number }>();
  (msgs || []).forEach((m) => {
    const partner = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    if (!conversationsMap.has(partner)) {
      conversationsMap.set(partner, {
        lastMessage: decryptText(m.content),
        time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestampNum: new Date(m.created_at).getTime(),
      });
    }
  });

  const partnerIds = Array.from(conversationsMap.keys());
  if (partnerIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: partners, error: partnersError } = await supabase
    .from("profiles")
    .select("id,name,college,department,avatar_url")
    .in("id", partnerIds);

  if (partnersError) {
    return NextResponse.json({ error: partnersError.message }, { status: 400 });
  }

  const result = (partners || []).map((p) => {
    const meta = conversationsMap.get(p.id);
    return {
      id: p.id,
      user: {
        id: p.id,
        name: p.name,
        college: p.college,
        dept: p.department || "CS",
        avatar_url: p.avatar_url,
        initials: p.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      },
      lastMessage: meta?.lastMessage || "",
      time: meta?.time || "",
      unread: 0,
      timestampNum: meta?.timestampNum || 0,
    };
  }).sort((a, b) => b.timestampNum - a.timestampNum);

  return NextResponse.json(result);
}
