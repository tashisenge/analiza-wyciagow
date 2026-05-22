import Link from "next/link";
import { redirect } from "next/navigation";

import { loginUser } from "@/server/actions/auth";

async function loginAction(formData: FormData): Promise<void> {
  "use server";
  const result = await loginUser(formData);
  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="page-title">Logowanie</h1>
      <p className="page-lead -mt-2">
        Analiza wyciągów mBank — dom i firma w jednym miejscu.
      </p>
      {params.registered === "1" ? (
        <p className="alert-success">Konto utworzone — możesz się zalogować.</p>
      ) : null}
      {params.error ? <p className="alert-error">{params.error}</p> : null}
      <form action={loginAction} className="section-card flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hasło
          <input name="password" type="password" required className="input-field" />
        </label>
        <button type="submit" className="btn-primary">
          Zaloguj się
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Nie masz konta?{" "}
        <Link href="/register" className="link-brand">
          Zarejestruj się
        </Link>
      </p>
      <p className="text-xs text-slate-500">
        Demo: <code>demo@analiza.local</code> / <code>demo12345</code>
      </p>
    </main>
  );
}
