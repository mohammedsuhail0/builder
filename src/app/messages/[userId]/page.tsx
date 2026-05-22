import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/main-nav";
import { SendMessageForm } from "@/components/send-message-form";
import { decryptText } from "@/lib/crypto";
import { isMvpMode } from "@/lib/mvp-mode";

type Params = { params: Promise<{ userId: string }> };

export default async function MessageThreadPage({ params }: Params) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !isMvpMode()) redirect("/auth/login");

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        <h1 className="font-heading text-3xl font-semibold">Demo Teammate</h1>
        <p className="mt-1 text-sm text-muted">Demo College</p>
        <MainNav />
        <section className="mt-6 grid gap-2">
          <article className="mr-auto max-w-[85%] rounded-xl bg-zinc-100 px-4 py-2 text-sm text-zinc-900">
            <p>Hey, let us build this together.</p>
          </article>
          <article className="ml-auto max-w-[85%] rounded-xl bg-brand px-4 py-2 text-sm text-white">
            <p>Yes, I am in.</p>
          </article>
        </section>
      </main>
    );
  }

  const [{ data: partner }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("id,name,college").eq("id", userId).single(),
    supabase
      .from("messages")
      .select("id,sender_id,recipient_id,content,created_at")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: true })
      .limit(300),
  ]);

  if (!partner) redirect("/messages");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold">{partner.name}</h1>
      <p className="mt-1 text-sm text-muted">{partner.college}</p>
      <MainNav />
      <section className="mt-6 grid gap-2">
        {(messages ?? []).map((m) => (
          <article
            key={m.id}
            className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
              m.sender_id === user.id
                ? "ml-auto bg-brand text-white"
                : "mr-auto bg-zinc-100 text-zinc-900"
            }`}
          >
            <p>{decryptText(m.content)}</p>
          </article>
        ))}
      </section>
      <SendMessageForm recipientId={userId} />
    </main>
  );
}
