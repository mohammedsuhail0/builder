import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import type { PostWithTimestamp } from "@/types/post";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id,title,description,skills_needed,created_at,author_id,idea_timestamps(posted_at,author_name,author_college)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const items = (posts ?? []) as PostWithTimestamp[];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold">Buildr Feed</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/posts/new"
            className="rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white"
          >
            Post
          </Link>
          <LogoutButton />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">{user.email}</p>
      {items.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-surface p-6">
          <p className="font-medium">No posts yet.</p>
          <p className="mt-1 text-sm text-muted">
            You are in. Start by exploring what others are building.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid gap-4">
          {items.map((post) => (
            (() => {
              const ts = post.idea_timestamps?.[0];
              return (
                <article key={post.id} className="rounded-2xl border border-zinc-200 bg-surface p-5">
                  <h2 className="font-heading text-xl font-semibold">{post.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{post.description}</p>
                  <p className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
                    Posted {new Date(ts?.posted_at ?? post.created_at).toLocaleString()} by{" "}
                    {ts?.author_name ?? "Unknown"}
                  </p>
                </article>
              );
            })()
          ))}
        </section>
      )}
    </main>
  );
}
