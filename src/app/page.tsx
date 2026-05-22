import Link from "next/link";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
      <h1 className="page-title text-3xl sm:text-4xl">Analiza wyciągów</h1>
      <p className="page-lead text-base">
        Importuj CSV z mBanku, kategoryzuj transakcje i zobacz, gdzie idą pieniądze —
        firma, dom lub razem.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/login" className="btn-primary">
          Zaloguj się
        </Link>
        <Link href="/register" className="btn-secondary">
          Załóż konto
        </Link>
      </div>
    </main>
  );
}
