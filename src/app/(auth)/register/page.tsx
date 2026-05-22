import Link from "next/link";
import { redirect } from "next/navigation";

import { registerUser } from "@/server/actions/auth";

async function registerAction(formData: FormData): Promise<void> {
  "use server";
  const result = await registerUser(formData);
  if (!result.ok) {
    redirect(`/register?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/login?registered=1");
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Rejestracja</h1>
      {params.error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      ) : null}
      <form action={registerAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Imię
          <input
            name="name"
            type="text"
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hasło (min. 8 znaków)
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Kod zaproszenia (opcjonalnie — dla partnera)
          <input
            name="inviteCode"
            type="text"
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Utwórz konto
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Masz konto?{" "}
        <Link href="/login" className="text-indigo-600 underline">
          Zaloguj się
        </Link>
      </p>
    </main>
  );
}
