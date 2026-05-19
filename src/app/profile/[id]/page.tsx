import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/main-nav";

type Params = { params: Promise<{ id: string }> };

export default async function ProfilePage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: posts }, { data: projects }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,name,college,department,year,skills,build_statement")
      .eq("id", id)
      .single(),
    supabase
      .from("posts")
      .select("id,title,description,created_at")
      .eq("author_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("project_members")
      .select("project_id,projects(id,name,description)")
      .eq("user_id", id),
  ]);

  if (!profile) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold">{profile.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {profile.college} • {profile.department} • Year {profile.year}
      </p>
      <p className="mt-2">{profile.build_statement}</p>
      <MainNav />
      {user.id !== id ? (
        <Link
          href={`/messages/${id}`}
          className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          Message
        </Link>
      ) : null}
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold">Ideas</h2>
        <div className="mt-3 grid gap-3">
          {(posts ?? []).map((p) => (
            <article key={p.id} className="rounded-xl border border-zinc-200 bg-surface p-4">
              <h3 className="font-medium">{p.title}</h3>
              <p className="mt-1 text-sm">{p.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold">Projects</h2>
        <div className="mt-3 grid gap-3">
          {(projects ?? []).map((row) => {
            const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
            if (!project) return null;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-xl border border-zinc-200 bg-surface p-4"
              >
                <h3 className="font-medium">{project.name}</h3>
                <p className="mt-1 text-sm">{project.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

