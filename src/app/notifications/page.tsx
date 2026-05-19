import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/main-nav";
import { MarkNotificationsReadButton } from "@/components/mark-notifications-read";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,type,is_read,created_at,payload")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold">Notifications</h1>
        <MarkNotificationsReadButton />
      </div>
      <MainNav />
      <section className="mt-6 grid gap-3">
        {(notifications ?? []).map((n) => (
          <article key={n.id} className="rounded-xl border border-zinc-200 bg-surface p-4">
            <p className="font-medium">{n.title}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">{n.type}</p>
            <p className="mt-2 text-xs text-muted">{new Date(n.created_at).toLocaleString()}</p>
            {!n.is_read ? (
              <p className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
                New
              </p>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}

