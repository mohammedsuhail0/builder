import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/main-nav";
import { AddUpdateForm, FollowButton } from "@/components/project-actions";
import { isMvpMode } from "@/lib/mvp-mode";

type Params = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !isMvpMode()) redirect("/auth/login");

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        <h1 className="font-heading text-3xl font-semibold">Buildr MVP</h1>
        <p className="mt-2">Demo project journey preview.</p>
        <MainNav />
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold">Team</h2>
          <p className="mt-3 rounded-lg border border-zinc-200 bg-surface px-3 py-2 text-sm">
            Suhail • Demo College • founder
          </p>
        </section>
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold">Timeline</h2>
          <article className="mt-3 rounded-xl border border-zinc-200 bg-surface p-4">
            <p className="mb-2 inline-block rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
              Milestone
            </p>
            <p className="text-sm">Built first connected MVP flow.</p>
          </article>
        </section>
      </main>
    );
  }

  const [{ data: project }, { data: members }, { data: updates }, { data: follow }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id,name,description,created_by")
        .eq("id", id)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("project_members")
        .select("role,profiles(id,name,college)")
        .eq("project_id", id),
      supabase
        .from("project_updates")
        .select("id,content,is_milestone,created_at,author_id")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("project_follows")
        .select("project_id")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (!project) notFound();

  const isMember = (members ?? []).some((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return profile?.id === user.id;
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold">{project.name}</h1>
      <p className="mt-2">{project.description}</p>
      <MainNav />
      <div className="mt-4">
        <FollowButton projectId={id} following={Boolean(follow)} />
      </div>
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold">Team</h2>
        <div className="mt-3 grid gap-2">
          {(members ?? []).map((m, i) => {
            const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
            if (!profile) return null;
            return (
              <p key={`${profile.id}-${i}`} className="rounded-lg border border-zinc-200 bg-surface px-3 py-2 text-sm">
                {profile.name} • {profile.college} • {m.role}
              </p>
            );
          })}
        </div>
      </section>
      {isMember ? (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold">Post Update</h2>
          <AddUpdateForm projectId={id} />
        </section>
      ) : null}
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold">Timeline</h2>
        <div className="mt-3 grid gap-3">
          {(updates ?? []).map((u) => (
            <article key={u.id} className="rounded-xl border border-zinc-200 bg-surface p-4">
              {u.is_milestone ? (
                <p className="mb-2 inline-block rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
                  Milestone
                </p>
              ) : null}
              <p className="text-sm whitespace-pre-wrap">{u.content}</p>
              <p className="mt-2 text-xs text-muted">{new Date(u.created_at).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
