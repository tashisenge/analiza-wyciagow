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
      <h1 className="text-2xl font-bold">Logowanie</h1>
      {params.registered === "1" ? (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          Konto utworzone — możesz się zalogować.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      ) : null}
      <form action={loginAction} className="flex flex-col gap-3">
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
          Hasło
          <input
            name="password"
            type="password"
            required
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Zaloguj się
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Nie masz konta?{" "}
        <Link href="/register" className="text-indigo-600 underline">
          Zarejestruj się
        </Link>
      </p>
      <p className="text-xs text-slate-500">
        Demo: <code>demo@analiza.local</code> / <code>demo12345</code>
      </p>
    </main>
  );
}
