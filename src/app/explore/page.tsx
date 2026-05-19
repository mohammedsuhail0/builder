import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/main-nav";

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,name,college,department,year,skills,build_statement")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold">Explore Builders</h1>
      <MainNav />
      <section className="mt-6 grid gap-3">
        {(profiles ?? []).map((p) => (
          <article key={p.id} className="rounded-xl border border-zinc-200 bg-surface p-4">
            <Link href={`/profile/${p.id}`} className="font-heading text-lg font-semibold">
              {p.name}
            </Link>
            <p className="text-sm text-muted">
              {p.college} • {p.department} • Year {p.year}
            </p>
            <p className="mt-1 text-sm">{p.build_statement}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

