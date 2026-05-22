import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/main-nav";
import { isMvpMode } from "@/lib/mvp-mode";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !isMvpMode()) redirect("/auth/login");

  const { data: projects } = user
    ? await supabase
        .from("projects")
        .select("id,name,description,created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50)
    : {
        data: [
          {
            id: "demo-project",
            name: "Buildr MVP",
            description: "Demo project journey preview.",
            created_at: new Date().toISOString(),
          },
        ],
      };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold">Projects</h1>
        <Link href="/projects/new" className="rounded-xl bg-brand px-4 py-2 text-sm text-white">
          New Project
        </Link>
      </div>
      <MainNav />
      <section className="mt-6 grid gap-3">
        {(projects ?? []).map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="rounded-xl border border-zinc-200 bg-surface p-4">
            <h2 className="font-heading text-lg font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm">{p.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
