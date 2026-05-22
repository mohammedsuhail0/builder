import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/main-nav";
import { isMvpMode } from "@/lib/mvp-mode";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !isMvpMode()) redirect("/auth/login");

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
        <h1 className="font-heading text-3xl font-semibold">Messages</h1>
        <MainNav />
        <section className="mt-6 grid gap-3">
          <Link href="/messages/demo-user" className="rounded-xl border border-zinc-200 bg-surface p-4">
            <p className="font-medium">Demo Teammate</p>
            <p className="text-sm text-muted">Demo College</p>
          </Link>
        </section>
      </main>
    );
  }

  const { data: msgs } = await supabase
    .from("messages")
    .select("sender_id,recipient_id,created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(200);

  const partnerIds = Array.from(
    new Set(
      (msgs ?? []).map((m) => (m.sender_id === user.id ? m.recipient_id : m.sender_id)),
    ),
  );

  const { data: partners } =
    partnerIds.length === 0
      ? { data: [] as { id: string; name: string; college: string }[] }
      : await supabase.from("profiles").select("id,name,college").in("id", partnerIds);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold">Messages</h1>
      <MainNav />
      <section className="mt-6 grid gap-3">
        {(partners ?? []).map((p) => (
          <Link
            href={`/messages/${p.id}`}
            key={p.id}
            className="rounded-xl border border-zinc-200 bg-surface p-4"
          >
            <p className="font-medium">{p.name}</p>
            <p className="text-sm text-muted">{p.college}</p>
          </Link>
        ))}
        {(partners ?? []).length === 0 ? (
          <p className="text-sm text-muted">No conversations yet. Start from any profile.</p>
        ) : null}
      </section>
    </main>
  );
}
