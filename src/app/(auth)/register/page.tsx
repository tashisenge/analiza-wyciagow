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
      <h1 className="page-title">Rejestracja</h1>
      <p className="page-lead -mt-2">
        Załóż workspace lub dołącz kodem zaproszenia od partnera.
      </p>
      {params.error ? <p className="alert-error">{params.error}</p> : null}
      <form action={registerAction} className="section-card flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Imię
          <input name="name" type="text" className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hasło (min. 8 znaków)
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Kod zaproszenia (opcjonalnie)
          <input name="inviteCode" type="text" className="input-field" />
        </label>
        <button type="submit" className="btn-primary">
          Utwórz konto
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Masz konto?{" "}
        <Link href="/login" className="link-brand">
          Zaloguj się
        </Link>
      </p>
    </main>
  );
}
