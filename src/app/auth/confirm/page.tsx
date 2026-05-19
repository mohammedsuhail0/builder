import Link from "next/link";

export default function ConfirmPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
      <h1 className="font-heading text-3xl font-semibold">Invite Confirmed</h1>
      <p className="mt-2 text-sm text-muted">
        If your invite token is valid, continue to set your password.
      </p>
      <Link
        href="/onboarding/password"
        className="mt-6 inline-block rounded-xl bg-brand px-4 py-3 text-center font-medium text-white"
      >
        Continue
      </Link>
    </main>
  );
}

