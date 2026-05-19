import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold">Buildr Feed (Demo)</h1>
        <Link href="/auth/login" className="rounded-xl border border-zinc-300 px-3 py-2 text-sm">
          Login
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">This is a preview of inside UI before auth.</p>

      <section className="mt-8 grid gap-4">
        <article className="rounded-2xl border border-zinc-200 bg-surface p-5">
          <h2 className="font-heading text-xl font-semibold">Campus skill-swap app</h2>
          <p className="mt-2 text-sm">
            Build a platform where students exchange coding, design, and speaking skills.
          </p>
          <p className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
            Posted 20 May 2026, 3:20 PM by Demo User
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-surface p-5">
          <h2 className="font-heading text-xl font-semibold">Mess food waste tracker</h2>
          <p className="mt-2 text-sm">
            Predict waste quantity daily using simple inputs and dashboard.
          </p>
          <p className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
            Posted 20 May 2026, 2:55 PM by Demo User
          </p>
        </article>
      </section>
    </main>
  );
}

