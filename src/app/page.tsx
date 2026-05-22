import Link from "next/link";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Analiza wyciągów</h1>
      <p className="text-slate-600">
        Importuj CSV z mBanku, kategoryzuj transakcje i zobacz, gdzie idą pieniądze —
        firma, dom lub razem.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Zaloguj się
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
        >
          Załóż konto
        </Link>
      </div>
    </main>
  );
}
